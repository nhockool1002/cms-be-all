import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

async function registerUser(app: INestApplication, username: string) {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ username, email: `${username}@example.com`, password: 'SuperSecret123!' })
    .expect(201);
  return res.body.accessToken as string;
}

describe('Social (e2e)', () => {
  let app: INestApplication;
  const suffix = randomUUID().slice(0, 8);
  const userA = `pm_a_${suffix}`;
  const userB = `pm_b_${suffix}`;
  let tokenA: string;
  let tokenB: string;

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

    tokenA = await registerUser(app, userA);
    tokenB = await registerUser(app, userB);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Private messaging', () => {
    let conversationId: string;

    it('creates a conversation with an initial message', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/conversations')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ participantUsernames: [userB], subject: 'Hello', body: 'Hi there!' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      conversationId = res.body.id;
    });

    it('rejects unknown recipient usernames', () => {
      return request(app.getHttpServer())
        .post('/api/conversations')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ participantUsernames: ['no_such_user_xyz'], body: 'Hi' })
        .expect(400);
    });

    it('lists the conversation for both participants', async () => {
      const resA = await request(app.getHttpServer())
        .get('/api/conversations')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);
      const resB = await request(app.getHttpServer())
        .get('/api/conversations')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(resA.body.some((c: { id: string }) => c.id === conversationId)).toBe(true);
      expect(resB.body.some((c: { id: string }) => c.id === conversationId)).toBe(true);
    });

    it('lets the recipient reply', async () => {
      await request(app.getHttpServer())
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ body: 'Hi back!' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.total).toBe(2);
    });

    it('rejects a non-participant from reading messages', async () => {
      const outsiderToken = await registerUser(app, `pm_c_${suffix}`);
      return request(app.getHttpServer())
        .get(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(403);
    });
  });

  describe('Groups', () => {
    const groupName = `Test Group ${suffix}`;
    let groupSlug: string;
    let discussionId: string;

    it('creates a group (creator becomes owner)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/groups')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: groupName, description: 'A group for testing' })
        .expect(201);

      groupSlug = res.body.slug;
      expect(res.body.ownerId).toBeDefined();
    });

    it('lists groups publicly', async () => {
      const res = await request(app.getHttpServer()).get('/api/groups').expect(200);
      expect(res.body.some((g: { slug: string }) => g.slug === groupSlug)).toBe(true);
    });

    it('rejects posting a discussion before joining', () => {
      return request(app.getHttpServer())
        .post(`/api/groups/${groupSlug}/discussions`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Should fail', body: 'nope' })
        .expect(403);
    });

    it('lets another user join a public group', () => {
      return request(app.getHttpServer())
        .post(`/api/groups/${groupSlug}/join`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(201);
    });

    it('lets a member create a discussion', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/groups/${groupSlug}/discussions`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Welcome thread', body: 'First post in the group' })
        .expect(201);

      discussionId = res.body.id;
      expect(discussionId).toBeDefined();
    });

    it('lets another member reply to the discussion', async () => {
      await request(app.getHttpServer())
        .post(`/api/discussions/${discussionId}/replies`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ body: 'Welcome!' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/api/discussions/${discussionId}/replies`)
        .expect(200);
      // createDiscussion seeds one reply from its `body` (like Forum Core's thread+first-post),
      // plus the one just posted above.
      expect(res.body.total).toBe(2);
    });
  });

  describe('Profile comments and follows', () => {
    let userAId: string;
    let userBId: string;

    beforeAll(async () => {
      const meA = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenA}`);
      const meB = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenB}`);
      userAId = meA.body.id;
      userBId = meB.body.id;
    });

    it('lets a user post a comment on another profile', async () => {
      await request(app.getHttpServer())
        .post(`/api/users/${userBId}/comments`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ body: 'Nice profile!' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/api/users/${userBId}/comments`)
        .expect(200);
      expect(res.body.total).toBe(1);
    });

    it('lets a user follow another and rejects self-follow', async () => {
      await request(app.getHttpServer())
        .post(`/api/users/${userBId}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/users/${userAId}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);

      const followers = await request(app.getHttpServer())
        .get(`/api/users/${userBId}/followers`)
        .expect(200);
      expect(followers.body.some((f: { username: string }) => f.username === userA)).toBe(true);
    });

    it('rejects a duplicate follow', () => {
      return request(app.getHttpServer())
        .post(`/api/users/${userBId}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(409);
    });

    it('lets a user unfollow', async () => {
      await request(app.getHttpServer())
        .delete(`/api/users/${userBId}/follow`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const following = await request(app.getHttpServer())
        .get(`/api/users/${userAId}/following`)
        .expect(200);
      expect(following.body.some((f: { username: string }) => f.username === userB)).toBe(false);
    });
  });
});
