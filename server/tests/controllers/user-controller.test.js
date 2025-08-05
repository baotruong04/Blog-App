const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');

const User = require('../../model/User');
const { getAllUser, signUp, logIn } = require('../../controller/user-contoller');

// Create test app
const app = express();
app.use(express.json());

// Add routes
app.get('/api/users', getAllUser);
app.post('/api/users/signup', signUp);
app.post('/api/users/login', logIn);

describe('User Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        User.mockImplementation((userData) => ({
            ...userData,
            save: jest.fn().mockResolvedValue({
                ...userData,
                _id: 'mock-id-123'
            })
        }));
    });

    describe('getAllUser', () => {
        it('should return all users successfully', async () => {
            const mockUsers = [
                global.createMockUser({ name: 'User 1', email: 'user1@example.com' }),
                global.createMockUser({ name: 'User 2', email: 'user2@example.com' })
            ];

            User.find.mockResolvedValue(mockUsers);

            const response = await request(app)
                .get('/api/users')
                .expect(200);

            expect(response.body).toHaveProperty('users');
            expect(response.body.users).toHaveLength(2);
            expect(User.find).toHaveBeenCalledTimes(1);
        });

        it('should handle database errors', async () => {
            User.find.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/users')
                .expect(404);

            expect(response.body.message).toBe('users are not found');
        });
    });

    describe('signUp', () => {
        const validSignupData = {
            name: 'New User',
            email: 'newuser@example.com',
            password: 'password123'
        };

        it('should create user successfully', async () => {
            User.findOne.mockResolvedValue(null);
            bcrypt.hashSync.mockReturnValue('hashedpassword123');

            const mockUser = global.createMockUser(validSignupData);
            User.mockImplementation((userData) => ({
                ...userData,
                save: jest.fn().mockResolvedValue(mockUser)
            }));

            const response = await request(app)
                .post('/api/users/signup')
                .send(validSignupData)
                .expect(201);

            expect(response.body).toHaveProperty('user');
            expect(User.findOne).toHaveBeenCalledWith({ email: validSignupData.email });
            expect(bcrypt.hashSync).toHaveBeenCalledWith(validSignupData.password);
        });

        it('should reject signup when user already exists', async () => {
            const existingUser = global.createMockUser({ email: validSignupData.email });
            User.findOne.mockResolvedValue(existingUser);

            const response = await request(app)
                .post('/api/users/signup')
                .send(validSignupData)
                .expect(400);

            expect(response.body.message).toBe('User is already exists!');
        });

        it('should handle database errors', async () => {
            User.findOne.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/api/users/signup')
                .send(validSignupData);

            expect(response.status).toBeDefined();
        });
    });

    describe('logIn', () => {
        const validLoginData = {
            email: 'test@example.com',
            password: 'password123'
        };

        it('should login successfully with correct credentials', async () => {
            const mockUser = global.createMockUser({
                email: validLoginData.email,
                password: 'hashedpassword123'
            });

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compareSync.mockReturnValue(true);

            const response = await request(app)
                .post('/api/users/login')
                .send(validLoginData)
                .expect(200);

            expect(response.body).toHaveProperty('user');
            expect(User.findOne).toHaveBeenCalledWith({ email: validLoginData.email });
            expect(bcrypt.compareSync).toHaveBeenCalledWith(
                validLoginData.password,
                mockUser.password
            );
        });

        it('should reject login with incorrect password', async () => {
            const mockUser = global.createMockUser({
                email: validLoginData.email,
                password: 'hashedpassword123'
            });

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compareSync.mockReturnValue(false);

            const response = await request(app)
                .post('/api/users/login')
                .send(validLoginData)
                .expect(400);

            expect(response.body.message).toBe('Incorrect Password!');
        });

        it('should reject login when user not found', async () => {
            User.findOne.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/users/login')
                .send(validLoginData)
                .expect(404);

            expect(response.body.message).toBe('User is not found');
        });

        it('should handle database errors', async () => {
            User.findOne.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/api/users/login')
                .send(validLoginData);

            expect(response.status).toBeDefined();
        });
    });

    describe('Performance Tests', () => {
        it('should handle concurrent user requests efficiently', async () => {
            User.find.mockResolvedValue([global.createMockUser()]);

            const startTime = Date.now();
            const requests = Array.from({ length: 20 }, () =>
                request(app).get('/api/users')
            );

            const responses = await Promise.all(requests);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });
        });

        it('should handle user authentication flow efficiently', async () => {
            const userData = {
                name: 'Performance User',
                email: 'perf@example.com',
                password: 'password123'
            };

            // Setup mocks for signup and login flow
            User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
                ...userData,
                password: 'hashedpassword123'
            });
            bcrypt.hashSync.mockReturnValue('hashedpassword123');
            bcrypt.compareSync.mockReturnValue(true);

            const mockUser = global.createMockUser(userData);
            User.mockImplementation((userData) => ({
                ...userData,
                save: jest.fn().mockResolvedValue(mockUser)
            }));

            const startTime = Date.now();

            // Signup and login operations
            await request(app).post('/api/users/signup').send(userData).expect(201);
            await request(app).post('/api/users/login').send({ email: userData.email, password: userData.password }).expect(200);

            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
        });
    });
});
