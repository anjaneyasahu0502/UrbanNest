const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

describe('Basic app health', () => {
  test('GET / returns 200', async () => {
    const res = await request(app).get('/');
    expect([200, 302]).toContain(res.statusCode);
  });

  test('GET /listings returns 200', async () => {
    const res = await request(app).get('/listings');
    expect(res.statusCode).toBe(200);
  });

  test('GET /auth/login returns 200', async () => {
    const res = await request(app).get('/auth/login');
    expect(res.statusCode).toBe(200);
  });

  test('GET /auth/register returns 200', async () => {
    const res = await request(app).get('/auth/register');
    expect(res.statusCode).toBe(200);
  });

  test('GET /auth/admin/login returns 200', async () => {
    const res = await request(app).get('/auth/admin/login');
    expect(res.statusCode).toBe(200);
  });

  test('GET /sahayata returns 200', async () => {
    const res = await request(app).get('/sahayata');
    expect(res.statusCode).toBe(200);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
