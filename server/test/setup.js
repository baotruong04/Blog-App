// Test setup file
require('dotenv').config({ path: '.env.test' });

// Mock console to reduce noise during tests
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};
