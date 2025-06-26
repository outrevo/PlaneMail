/** @type {import('jest').Config} */
module.exports = {
  projects: [
    '<rootDir>/apps/web',
    '<rootDir>/packages/shared',
    '<rootDir>/packages/queue-service'
  ],
  collectCoverageFrom: [
    'apps/*/src/**/*.{js,jsx,ts,tsx}',
    'packages/*/src/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  testMatch: [
    '<rootDir>/apps/*/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/apps/*/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/packages/*/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/packages/*/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};