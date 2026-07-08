const request = require('supertest');
const app = require('../app');

(async () => {
  const res = await request(app).get('/');
  const ok = res.text.includes('href="/favicon.svg"');
  console.log('has_favicon:', ok);
  process.exit(ok ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
