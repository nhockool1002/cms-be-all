import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('User public profile (e2e)', () => {
  let app: INestApplication;
  const suffix = randomUUID().slice(0, 8);
  const username = `profile_user_${suffix}`;
  let accessToken: string;
  let boardSlug: string;

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

    const registerRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      username,
      email: `${username}@example.com`,
      password: 'SuperSecret123!',
    });
    accessToken = registerRes.body.accessToken;

    const boardRes = await request(app.getHttpServer()).get('/api/boards');
    boardSlug = boardRes.body[0]?.slug;
    if (!boardSlug) {
      // No board exists yet (CI's test-api job never runs the seed script), so create
      // one as an admin -- board creation requires the admin role, which the just-
      // registered test user doesn't have. Grant it directly via Prisma, same approach
      // as cms.e2e-spec.ts.
      const adminUsername = `profile_board_admin_${suffix}`;
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
      const adminUser = await prisma.user.findUniqueOrThrow({
        where: { username: adminUsername },
      });
      await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
      const adminLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: adminUsername, password: 'SuperSecret123!' });

      const created = await request(app.getHttpServer())
        .post('/api/boards')
        .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
        .send({ name: `Profile Test Board ${suffix}` });
      boardSlug = created.body.slug;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 404 for an unknown username', () => {
    return request(app.getHttpServer())
      .get('/api/users/by-username/no_such_user_xyz')
      .expect(404);
  });

  it('returns a public profile with zeroed counts for a fresh user', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/users/by-username/${username}`)
      .expect(200);

    expect(res.body.username).toBe(username);
    expect(res.body.postCount).toBe(0);
    expect(res.body.threadCount).toBe(0);
    expect(res.body.rankTitle).toBe('New Member');
    expect(res.body.followerCount).toBe(0);
    expect(res.body.followingCount).toBe(0);
  });

  it('reflects post/thread counts after posting', async () => {
    await request(app.getHttpServer())
      .post(`/api/boards/${boardSlug}/threads`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: `Profile count test ${suffix}`, bodyMarkdown: 'first post' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/users/by-username/${username}`)
      .expect(200);

    expect(res.body.threadCount).toBe(1);
    expect(res.body.postCount).toBe(1);
  });

  it('reflects follower count after another user follows', async () => {
    const followerUsername = `profile_follower_${suffix}`;
    const followerRes = await request(app.getHttpServer()).post('/api/auth/register').send({
      username: followerUsername,
      email: `${followerUsername}@example.com`,
      password: 'SuperSecret123!',
    });
    const followerToken = followerRes.body.accessToken;

    const profileRes = await request(app.getHttpServer()).get(
      `/api/users/by-username/${username}`,
    );
    const profileId = profileRes.body.id;

    await request(app.getHttpServer())
      .post(`/api/users/${profileId}/follow`)
      .set('Authorization', `Bearer ${followerToken}`)
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/users/by-username/${username}`)
      .expect(200);
    expect(res.body.followerCount).toBe(1);
  });
});
