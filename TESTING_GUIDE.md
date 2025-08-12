# Testing Guide for Blog-App

This guide provides comprehensive instructions for running tests in the Blog-App project using Jest. The project has two main testing environments: **Server** (Node.js/Express) and **Client** (React).

## Table of Contents
- [Prerequisites](#prerequisites)
- [Server Testing](#server-testing)
- [Client Testing](#client-testing)
- [Test Reports](#test-reports)
- [Continuous Integration](#continuous-integration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before running tests, ensure you have the following installed:

```bash
# Node.js (version 14 or higher)
node --version

# npm (comes with Node.js)
npm --version

# Install dependencies
npm install
```

## Server Testing

### Setup

The server tests are located in `/server/tests/` and use Jest with additional testing utilities.

```bash
# Navigate to server directory
cd server

# Install server dependencies
npm install
```

### Running Server Tests

#### Run All Server Tests
```bash
# From server directory
npm test

# Alternative: Run with npm from root directory
npm run test:server
```

#### Run Specific Test Categories
```bash
# Run model tests only
npm test -- tests/models/

# Run controller tests only
npm test -- tests/controllers/

# Run route tests only
npm test -- tests/routes/
```

#### Run Individual Test Files
```bash
# Run specific test file
npm test -- tests/models/User.test.js
npm test -- tests/models/Blog.test.js
npm test -- tests/controllers/user-controller.test.js
npm test -- tests/controllers/blog-controller.test.js
npm test -- tests/routes/user-routes.test.js
npm test -- tests/routes/blog-routes.test.js
```

#### Watch Mode
```bash
# Run tests in watch mode (re-runs on file changes)
npm test -- --watch

# Watch specific files
npm test -- --watch tests/models/
```

#### Debug Mode
```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests with coverage
npm test -- --coverage

# Run tests with detailed error information
npm test -- --verbose --no-cache
```

### Server Test Structure

```
server/tests/
├── setup.js                 # Global test configuration and mocks
├── __mocks__/               # Mock implementations
│   └── server.js
├── controllers/             # Controller unit tests
│   ├── blog-controller.test.js
│   └── user-controller.test.js
├── models/                  # Model unit tests
│   ├── Blog.test.js
│   └── User.test.js
├── routes/                  # Route integration tests
│   ├── blog-routes.test.js
│   └── user-routes.test.js
└── utils/                   # Test utilities
```

## Client Testing

### Setup

The client tests are located in `/client/src/tests/` and use Jest with React Testing Library.

```bash
# Navigate to client directory
cd client

# Install client dependencies
npm install
```

### Running Client Tests

#### Run All Client Tests
```bash
# From client directory
npm test

# Alternative: Run with npm from root directory
npm run test:client
```

#### Run Specific Test Categories
```bash
# Run component tests only
npm test -- src/tests/components/

# Run store tests only
npm test -- src/tests/store/

# Run utility tests only
npm test -- src/tests/utils/
```

#### Run Individual Test Files
```bash
# Run specific test file
npm test -- src/tests/components/Header.test.js
npm test -- src/tests/components/Login.test.js
npm test -- src/tests/components/Blogs.test.js
npm test -- src/tests/store/store.test.js
```

#### Interactive Mode
```bash
# Run tests in interactive watch mode
npm test

# Then use these commands:
# Press 'a' to run all tests
# Press 'f' to run only failed tests
# Press 'p' to filter by filename pattern
# Press 'q' to quit watch mode
```

### Client Test Structure

```
client/src/tests/
├── setup.js                # Test setup and configuration
├── __mocks__/              # Mock implementations
│   └── server.js
├── components/             # Component unit tests
│   ├── Header.test.js
│   ├── Login.test.js
│   └── Blogs.test.js
├── store/                  # State management tests
│   └── store.test.js
└── utils/                  # Utility function tests
    └── test-utils.js
```

## Test Reports

### Coverage Reports

#### Server Coverage
```bash
# Generate coverage report for server
cd server
npm test -- --coverage

# Generate coverage report with detailed output
npm test -- --coverage --verbose

# Generate coverage in different formats
npm test -- --coverage --coverageReporters=text,lcov,html
```

#### Client Coverage
```bash
# Generate coverage report for client
cd client
npm test -- --coverage --watchAll=false

# Generate coverage with threshold checking
npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

### HTML Reports

#### Server HTML Coverage Report
```bash
cd server
npm test -- --coverage --coverageReporters=html
# Report will be generated in server/coverage/lcov-report/index.html
```

#### Client HTML Coverage Report
```bash
cd client
npm test -- --coverage --coverageReporters=html --watchAll=false
# Report will be generated in client/coverage/lcov-report/index.html
```

### JSON Reports for CI/CD

```bash
# Generate JSON reports for automated processing
cd server
npm test -- --coverage --coverageReporters=json --outputFile=./coverage/coverage.json

cd client
npm test -- --coverage --coverageReporters=json --outputFile=./coverage/coverage.json --watchAll=false
```

### JUnit XML Reports

```bash
# Install jest-junit for XML reports
npm install --save-dev jest-junit

# Generate XML reports
cd server
npm test -- --reporters=jest-junit --outputFile=./test-results/junit.xml

cd client
npm test -- --reporters=jest-junit --outputFile=./test-results/junit.xml --watchAll=false
```

## Running Tests from Root Directory

You can run tests for both server and client from the project root:

```bash
# Add these scripts to your root package.json
{
  "scripts": {
    "test": "npm run test:server && npm run test:client",
    "test:server": "cd server && npm test",
    "test:client": "cd client && npm test -- --watchAll=false",
    "test:coverage": "npm run test:server:coverage && npm run test:client:coverage",
    "test:server:coverage": "cd server && npm test -- --coverage",
    "test:client:coverage": "cd client && npm test -- --coverage --watchAll=false"
  }
}
```

Then run:
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install server dependencies
      run: |
        cd server
        npm ci
    
    - name: Install client dependencies
      run: |
        cd client
        npm ci
    
    - name: Run server tests
      run: |
        cd server
        npm test -- --coverage --coverageReporters=lcov
    
    - name: Run client tests
      run: |
        cd client
        npm test -- --coverage --coverageReporters=lcov --watchAll=false
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        directory: ./server/coverage
        flags: server
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        directory: ./client/coverage
        flags: client
```

## Troubleshooting

### Common Issues

#### 1. Tests Not Running
```bash
# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 2. Module Resolution Issues
```bash
# Check Jest configuration in package.json
{
  "jest": {
    "testEnvironment": "node",
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"],
    "collectCoverageFrom": [
      "**/*.js",
      "!**/node_modules/**",
      "!**/coverage/**"
    ]
  }
}
```

#### 3. Memory Issues with Large Test Suites
```bash
# Increase memory limit
node --max_old_space_size=4096 ./node_modules/.bin/jest

# Run tests with limited concurrency
npm test -- --maxWorkers=2
```

#### 4. Timeout Issues
```bash
# Increase timeout for specific tests
npm test -- --testTimeout=10000

# Or set in jest.config.js
module.exports = {
  testTimeout: 10000
};
```

### Performance Tips

1. **Use `.only` for focused testing during development:**
   ```javascript
   describe.only('User Model', () => {
     // Only this test suite will run
   });
   ```

2. **Skip slow tests during development:**
   ```javascript
   describe.skip('Slow integration tests', () => {
     // These tests will be skipped
   });
   ```

3. **Use `--bail` to stop on first failure:**
   ```bash
   npm test -- --bail
   ```

4. **Use `--silent` to reduce output:**
   ```bash
   npm test -- --silent
   ```

## Best Practices

1. **Run tests before committing code**
2. **Maintain high test coverage (>80%)**
3. **Write tests for critical functionality first**
4. **Use descriptive test names**
5. **Keep tests isolated and independent**
6. **Mock external dependencies**
7. **Test both success and failure scenarios**

## Test Scripts Summary

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm test -- --watch` | Run tests in watch mode |
| `npm test -- --coverage` | Run tests with coverage |
| `npm test -- --verbose` | Run tests with detailed output |
| `npm test -- --bail` | Stop on first failure |
| `npm test -- tests/models/` | Run specific test directory |
| `npm test -- User.test.js` | Run specific test file |

For more detailed Jest documentation, visit: https://jestjs.io/docs/getting-started
