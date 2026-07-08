const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

describe('Basic app health', () => {
  test('GET / redirects to /listings', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/listings');
  });
});

afterAll(async () => {
  // close mongoose connection to allow Jest to exit
  await mongoose.connection.close();
});
