module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],
    collectCoverageFrom: [
        'controller/**/*.js',
        'model/**/*.js',
        'routes/**/*.js',
        '!**/node_modules/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/test/setup.js']
};
