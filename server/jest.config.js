module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/tests/**/*.test.js',
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],
    collectCoverageFrom: [
        'controller/**/*.js',
        'model/**/*.js',
        'routes/**/*.js',
        'config/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**',
        '!**/coverage/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 10000,
    verbose: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
