/**
 * Jest test setup file
 * 
 * This file is run before each test suite and can be used to configure
 * global test settings, mocks, and utilities.
 */

// Set up test environment variables
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCOUNT_ID = '123456789012';
process.env.CDK_DEFAULT_REGION = 'us-east-1';
process.env.CDK_DEFAULT_ACCOUNT = '123456789012';

// Global test timeout
jest.setTimeout(30000);

// Mock console.warn to reduce noise in tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  // Only show warnings that are not validation warnings
  if (!args[0]?.includes?.('[Bedrock')) {
    originalWarn(...args);
  }
};