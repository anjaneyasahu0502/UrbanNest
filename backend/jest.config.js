/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // Only pick up files in test/ — never in tests/e2e/ (those are Playwright)
  testMatch: ['<rootDir>/test/**/*.test.js'],
  // Belt-and-suspenders: also ignore by path pattern
  testPathIgnorePatterns: ['/node_modules/', '/tests/'],
  // Give each test file 30 s to finish (DB is remote Atlas)
  testTimeout: 30000,
};
