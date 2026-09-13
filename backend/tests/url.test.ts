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

  it('returns 400 for circular redirect (same host)', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({ originalUrl: 'http://localhost:4000/abc123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/circular/i);
  });

  it('returns 400 for circular redirect with uppercase scheme', async () => {
    const res = await request(app)
      .post('/api/shorten')
      .send({ originalUrl: 'HTTP://LOCALHOST:4000/path' });

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

  it('returns 200 with stats including uniqueClicks', async () => {
    const res = await request(app).get(`/api/stats/${shortCode}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      shortCode,
      originalUrl: 'https://stats-test.com',
      clicks: expect.any(Number),
      uniqueClicks: expect.any(Number),
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

  it('does not create ghost Redis key for unknown code', async () => {
    await request(app).get('/zzzzzz');
    const exists = await redis.exists('visits:zzzzzz');
    expect(exists).toBe(0);
  });

  it('returns 404 for an unknown code', async () => {
    const res = await request(app).get('/xxxxxx');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/links/:userId', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440001';

  beforeAll(async () => {
    await request(app)
      .post('/api/shorten')
      .send({ originalUrl: 'https://user-links-test.com', userId });
  });

  it('returns links for a known userId', async () => {
    const res = await request(app).get(`/api/links/${userId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toMatchObject({
      shortCode: expect.any(String),
      originalUrl: 'https://user-links-test.com',
      clicks: expect.any(Number),
      uniqueClicks: expect.any(Number),
    });
  });

  it('returns empty array for unknown userId', async () => {
    const res = await request(app).get('/api/links/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
