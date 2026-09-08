process.env.MONGOMS_SKIP_MD5_CHECK = 'true';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/index.js',
    '!src/express-app.js',
    '!src/database/connection.js',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 180000,
};