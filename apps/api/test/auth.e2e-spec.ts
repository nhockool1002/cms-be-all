import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth + Forum flow (e2e)', () => {
  let app: INestApplication;
  const username = `e2e_${randomUUID().slice(0, 8)}`;
  const password = 'SuperSecret123!';
  let accessToken: string;
  let refreshToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ username, email: `${username}@example.com`, password })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('rejects duplicate registration', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ username, email: `${username}@example.com`, password })
      .expect(409);
  });

  it('logs in with correct credentials', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username, password })
      .expect(201)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
      });
  });

  it('rejects login with wrong password', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username, password: 'wrong-password' })
      .expect(401);
  });

  it('returns the current user for a valid access token', () => {
    return request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.username).toBe(username);
      });
  });

  it('rejects requests without a token', () => {
    return request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('refreshes tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).not.toBe(refreshToken);
  });

  it('rejects creating a board without admin role', () => {
    return request(app.getHttpServer())
      .post('/api/boards')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Should Not Be Created' })
      .expect(403);
  });

  it('lists boards publicly', () => {
    return request(app.getHttpServer()).get('/api/boards').expect(200).expect((res) => {
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
