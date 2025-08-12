require('dotenv').config({ path: '.env.test' });

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('mongoose');

// Mock User model with full methods
jest.mock('../model/User', () => {
    const MockUser = jest.fn().mockImplementation((userData) => {
        const instance = {
            ...userData,
            save: jest.fn().mockResolvedValue({
                ...userData,
                _id: 'mock-id-123'
            })
        };
        return instance;
    });

    MockUser.find = jest.fn();
    MockUser.findOne = jest.fn();
    MockUser.findById = jest.fn();
    MockUser.findByIdAndUpdate = jest.fn();
    MockUser.findByIdAndDelete = jest.fn();

    return MockUser;
});

// Mock Blog model with full methods
jest.mock('../model/Blog', () => {
    const MockBlog = jest.fn().mockImplementation((blogData) => {
        const instance = {
            ...blogData,
            save: jest.fn().mockResolvedValue({
                ...blogData,
                _id: 'mock-blog-id-123'
            })
        };
        return instance;
    });

    MockBlog.find = jest.fn();
    MockBlog.findOne = jest.fn();
    MockBlog.findById = jest.fn();
    MockBlog.findByIdAndUpdate = jest.fn();
    MockBlog.findByIdAndDelete = jest.fn();

    return MockBlog;
});

// Mock console to reduce noise during tests
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
};

// Mock process.env for tests
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/test_blog_db';

// Global test helpers
global.createMockUser = (overrides = {}) => ({
    _id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword123',
    blogs: [],
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

global.createMockBlog = (overrides = {}) => ({
    _id: 'blog123',
    title: 'Test Blog',
    desc: 'Test description',
    img: 'test-image.jpg',
    user: 'user123',
    date: new Date('2024-01-01'),
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
});

// Mock mongoose session
global.createMockSession = () => ({
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
});

// Global setup and teardown
beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(() => {
    jest.resetAllMocks();
});

// Suppress specific warnings
const originalWarn = console.warn;
beforeAll(() => {
    console.warn = (...args) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render is deprecated')
        ) {
            return;
        }
        originalWarn.call(console, ...args);
    };
});

afterAll(() => {
    console.warn = originalWarn;
});
