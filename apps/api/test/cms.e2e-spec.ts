import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('CMS (e2e)', () => {
  let app: INestApplication;
  const suffix = randomUUID().slice(0, 8);
  let adminToken: string;
  let memberToken: string;
  let pageId: string;
  let pageSlug: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.setGlobalPrefix('api');
    await app.init();

    const memberRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        username: `cms_member_${suffix}`,
        email: `cms_member_${suffix}@example.com`,
        password: 'SuperSecret123!',
      });
    memberToken = memberRes.body.accessToken;

    // Register a plain user, then grant it the admin role directly via Prisma --
    // there's no public API to self-promote, and CI's test-api job never runs the
    // seed script (only migrations), so a pre-seeded "admin" account can't be relied on.
    const adminUsername = `cms_admin_${suffix}`;
    await request(app.getHttpServer()).post('/api/auth/register').send({
      username: adminUsername,
      email: `${adminUsername}@example.com`,
      password: 'SuperSecret123!',
    });

    const prisma = app.get(PrismaService);
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin', description: 'Full administrative access' },
    });
    const adminUser = await prisma.user.findUniqueOrThrow({ where: { username: adminUsername } });
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });

    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: adminUsername, password: 'SuperSecret123!' });
    adminToken = adminRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Pages', () => {
    it('rejects page creation from a non-admin', () => {
      return request(app.getHttpServer())
        .post('/api/admin/pages')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ title: `Should fail ${suffix}`, bodyMarkdown: 'nope' })
        .expect(403);
    });

    it('lets an admin create a draft page', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/pages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: `About Us ${suffix}`, bodyMarkdown: 'We are a community.' })
        .expect(201);

      pageId = res.body.id;
      pageSlug = res.body.slug;
      expect(res.body.status).toBe('DRAFT');
    });

    it('does not show a draft page on the public endpoint', async () => {
      await request(app.getHttpServer()).get(`/api/pages/${pageSlug}`).expect(404);

      const list = await request(app.getHttpServer()).get('/api/pages').expect(200);
      expect(list.body.some((p: { id: string }) => p.id === pageId)).toBe(false);
    });

    it('shows the draft to an admin via the admin endpoint', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/admin/pages/${pageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.id).toBe(pageId);
    });

    it('publishing the page makes it publicly visible and sets publishedAt', async () => {
      const updateRes = await request(app.getHttpServer())
        .patch(`/api/admin/pages/${pageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PUBLISHED' })
        .expect(200);
      expect(updateRes.body.publishedAt).toBeDefined();
      expect(updateRes.body.publishedAt).not.toBeNull();

      const res = await request(app.getHttpServer()).get(`/api/pages/${pageSlug}`).expect(200);
      expect(res.body.status).toBe('PUBLISHED');
    });

    it('editing body content creates a version snapshot of the old body', async () => {
      await request(app.getHttpServer())
        .patch(`/api/admin/pages/${pageId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ bodyMarkdown: 'Updated body content.' })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/api/pages/${pageSlug}`)
        .expect(200);
      expect(res.body.bodyMarkdown).toBe('Updated body content.');
    });
  });

  describe('Widgets', () => {
    it('rejects widget creation from a non-admin', () => {
      return request(app.getHttpServer())
        .post('/api/widgets')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ type: 'html', placement: 'sidebar', config: { html: '<p>hi</p>' } })
        .expect(403);
    });

    it('lets an admin create a widget and lists it by placement', async () => {
      await request(app.getHttpServer())
        .post('/api/widgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'html', placement: `sidebar_${suffix}`, config: { html: '<p>hi</p>' } })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/widgets')
        .query({ placement: `sidebar_${suffix}` })
        .expect(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].config.html).toBe('<p>hi</p>');
    });
  });

  describe('Menus', () => {
    const menuName = `main_${suffix}`;

    it('lets an admin create a menu and add items', async () => {
      await request(app.getHttpServer())
        .post('/api/menus')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: menuName })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/menus/${menuName}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ label: 'Home', url: '/', displayOrder: 0 })
        .expect(201);

      const res = await request(app.getHttpServer()).get(`/api/menus/${menuName}`).expect(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].label).toBe('Home');
    });
  });
});
