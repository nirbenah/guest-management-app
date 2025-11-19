module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setupTests.ts'],
  testTimeout: 30000,
  maxConcurrency: 1,
  forceExit: true,
  detectOpenHandles: true,
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.js'
};