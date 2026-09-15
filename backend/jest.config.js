module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/database/**', '!src/server.js'],
  coverageThreshold: { global: { branches: 70, functions: 75, lines: 75, statements: 75 } },
  setupFilesAfterFramework: ['./jest.setup.js'],
  testTimeout: 10000,
};
