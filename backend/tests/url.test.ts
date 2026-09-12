import 'dotenv/config';
import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/config/database';
import { redis } from '../src/config/redis';

afterAll(async () => {
  await pool.end();
  await redis.quit();
});

describe('POST /api/shorten', () => {
  it('returns 201 with shortCode and shortUrl for a valid URL', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({ originalUrl: 'https://example.com' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('shortCode');
    expect(res.body).toHaveProperty('shortUrl');
    expect(res.body.shortCode).toHaveLength(6);
  });

  it('returns 400 for an invalid URL', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({ originalUrl: 'not-a-url' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 for a non-http(s) URL', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({ originalUrl: 'ftp://example.com' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when originalUrl is missing', async () => {
    const res = await request(app).post('/api/shorten').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/stats/:shortCode', () => {
  let shortCode: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({ originalUrl: 'https://stats-test.com' });
    shortCode = res.body.shortCode;
  });

  it('returns 200 with stats for an existing code', async () => {
    const res = await request(app).get(`/api/stats/${shortCode}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      shortCode,
      originalUrl: 'https://stats-test.com',
      clicks: expect.any(Number),
    });
  });

  it('returns 404 for an unknown code', async () => {
    const res = await request(app).get('/api/stats/xxxxxx');
    expect(res.status).toBe(404);
  });
});

describe('GET /:shortCode', () => {
  let shortCode: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({ originalUrl: 'https://redirect-test.com' });
    shortCode = res.body.shortCode;
  });

  it('redirects (302) to the original URL', async () => {
    const res = await request(app).get(`/${shortCode}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://redirect-test.com');
  });

  it('increments click count after redirect', async () => {
    await request(app).get(`/${shortCode}`);
    await request(app).get(`/${shortCode}`);
    const stats = await request(app).get(`/api/stats/${shortCode}`);
    expect(stats.body.clicks).toBeGreaterThanOrEqual(2);
  });

  it('returns 404 for an unknown code', async () => {
    const res = await request(app).get('/xxxxxx');
    expect(res.status).toBe(404);
  });
});
