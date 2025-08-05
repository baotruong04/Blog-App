const request = require('supertest');
const express = require('express');
const userRoutes = require('../../routes/user-routes');

// Mock the controller (setup.js already mocks User model and mongoose)
jest.mock('../../controller/user-contoller', () => ({
    getAllUser: jest.fn(),
    signUp: jest.fn(),
    logIn: jest.fn()
}));

const userController = require('../../controller/user-contoller');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/user', userRoutes);

// Helper function to create mock request data
const createMockRequest = (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    ...overrides
});

describe('User Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/user', () => {
        it('should get all users successfully', async () => {
            const mockUsers = [
                createMockUser(),
                createMockUser({ _id: 'user456', name: 'User 2', email: 'user2@example.com' })
            ];

            userController.getAllUser.mockImplementation((req, res) => {
                res.status(200).json({
                    users: mockUsers.map(user => ({
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        blogs: user.blogs
                    }))
                });
            });

            const response = await request(app)
                .get('/api/user');

            expect(response.status).toBe(200);
            expect(response.body.users).toHaveLength(2);
            expect(userController.getAllUser).toHaveBeenCalled();
        });

        it('should handle database error', async () => {
            userController.getAllUser.mockImplementation((req, res) => {
                res.status(500).json({
                    message: 'Database error'
                });
            });

            const response = await request(app)
                .get('/api/user');

            expect(response.status).toBe(500);
        });
    });

    describe('POST /api/user/signup', () => {
        it('should create a new user successfully', async () => {
            const mockUser = createMockUser();
            const requestData = createMockRequest();

            userController.signUp.mockImplementation((req, res) => {
                res.status(201).json({
                    success: true,
                    user: {
                        _id: mockUser._id,
                        name: mockUser.name,
                        email: mockUser.email,
                        blogs: mockUser.blogs
                    }
                });
            });

            const response = await request(app)
                .post('/api/user/signup')
                .send(requestData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(userController.signUp).toHaveBeenCalled();
        });

        it('should handle validation errors', async () => {
            const requestData = {
                name: '',
                email: 'invalid-email',
                password: '123'
            };

            userController.signUp.mockImplementation((req, res) => {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed'
                });
            });

            const response = await request(app)
                .post('/api/user/signup')
                .send(requestData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should handle duplicate email', async () => {
            const requestData = createMockRequest();

            userController.signUp.mockImplementation((req, res) => {
                res.status(409).json({
                    success: false,
                    message: 'User already exists with this email'
                });
            });

            const response = await request(app)
                .post('/api/user/signup')
                .send(requestData);

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });

        it('should handle database errors', async () => {
            const requestData = createMockRequest();

            userController.signUp.mockImplementation((req, res) => {
                res.status(500).json({
                    success: false,
                    message: 'Database connection failed'
                });
            });

            const response = await request(app)
                .post('/api/user/signup')
                .send(requestData);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/user/login', () => {
        it('should login user successfully', async () => {
            const mockUser = createMockUser();
            const requestData = {
                email: 'test@example.com',
                password: 'password123'
            };

            userController.logIn.mockImplementation((req, res) => {
                res.status(200).json({
                    success: true,
                    user: {
                        _id: mockUser._id,
                        name: mockUser.name,
                        email: mockUser.email,
                        blogs: mockUser.blogs
                    },
                    token: 'jwt-token-here'
                });
            });

            const response = await request(app)
                .post('/api/user/login')
                .send(requestData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(userController.logIn).toHaveBeenCalled();
        });

        it('should handle validation errors', async () => {
            const requestData = {
                email: '',
                password: ''
            };

            userController.logIn.mockImplementation((req, res) => {
                res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            });

            const response = await request(app)
                .post('/api/user/login')
                .send(requestData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should handle authentication errors', async () => {
            const requestData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            userController.logIn.mockImplementation((req, res) => {
                res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            });

            const response = await request(app)
                .post('/api/user/login')
                .send(requestData);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should handle database errors', async () => {
            const requestData = {
                email: 'test@example.com',
                password: 'password123'
            };

            userController.logIn.mockImplementation((req, res) => {
                res.status(500).json({
                    success: false,
                    message: 'Database connection failed'
                });
            });

            const response = await request(app)
                .post('/api/user/login')
                .send(requestData);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Performance Tests', () => {
        it('should handle concurrent requests efficiently', async () => {
            const mockUser = createMockUser();

            userController.logIn.mockImplementation((req, res) => {
                res.status(200).json({
                    success: true,
                    user: mockUser,
                    token: 'jwt-token'
                });
            });

            const startTime = Date.now();
            const requests = Array.from({ length: 50 }, () =>
                request(app)
                    .post('/api/user/login')
                    .send({ email: 'test@example.com', password: 'password123' })
            );

            await Promise.all(requests);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
            expect(userController.logIn).toHaveBeenCalledTimes(50);
        });
    });
});
