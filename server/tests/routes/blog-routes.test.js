const request = require('supertest');
const express = require('express');
const blogRoutes = require('../../routes/blog-routes');

// Mock the controller
jest.mock('../../controller/blog-controller', () => ({
    getAllBlogs: jest.fn(),
    addBlog: jest.fn(),
    updateBlog: jest.fn(),
    getById: jest.fn(),
    deleteBlog: jest.fn(),
    getByUserId: jest.fn()
}));

const blogController = require('../../controller/blog-controller');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/blog', blogRoutes);

// Error handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Helper function for mock blog request
const createMockBlogRequest = (overrides = {}) => ({
    title: 'New Blog Post',
    desc: 'This is a new blog post',
    img: 'https://example.com/new-image.jpg',
    user: 'user123',
    ...overrides
});

describe('Blog Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/blog', () => {
        it('should get all blogs successfully', async () => {
            const mockBlogs = [
                createMockBlog(),
                createMockBlog({ _id: 'blog456', title: 'Second Blog' })
            ];

            blogController.getAllBlogs.mockImplementation((req, res) => {
                res.status(200).json({
                    success: true,
                    blogs: mockBlogs
                });
            });

            const response = await request(app).get('/api/blog');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.blogs).toHaveLength(2);
            expect(blogController.getAllBlogs).toHaveBeenCalled();
        });

        it('should handle empty blog list', async () => {
            blogController.getAllBlogs.mockImplementation((req, res) => {
                res.status(200).json({
                    success: true,
                    blogs: []
                });
            });

            const response = await request(app).get('/api/blog');

            expect(response.status).toBe(200);
            expect(response.body.blogs).toEqual([]);
        });

        it('should handle database connection error', async () => {
            blogController.getAllBlogs.mockImplementation((req, res) => {
                res.status(500).json({
                    success: false,
                    message: 'Database connection failed'
                });
            });

            const response = await request(app).get('/api/blog');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/blog/add', () => {
        it('should create a new blog successfully', async () => {
            const mockBlog = createMockBlog();
            const requestData = createMockBlogRequest();

            blogController.addBlog.mockImplementation((req, res) => {
                res.status(201).json({
                    success: true,
                    blog: mockBlog
                });
            });

            const response = await request(app)
                .post('/api/blog/add')
                .send(requestData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(blogController.addBlog).toHaveBeenCalled();
        });

        it('should handle missing required fields', async () => {
            const requestData = {
                desc: 'Blog description',
                img: 'https://example.com/image.jpg'
                // missing title and user
            };

            blogController.addBlog.mockImplementation((req, res) => {
                res.status(400).json({
                    success: false,
                    message: 'Title and user are required'
                });
            });

            const response = await request(app)
                .post('/api/blog/add')
                .send(requestData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should handle empty request body', async () => {
            blogController.addBlog.mockImplementation((req, res) => {
                res.status(400).json({
                    success: false,
                    message: 'All required fields must be provided'
                });
            });

            const response = await request(app)
                .post('/api/blog/add')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/blog/update/:id', () => {
        it('should update a blog successfully', async () => {
            const blogId = 'blog123';
            const updatedBlog = createMockBlog({
                title: 'Updated Blog Title',
                desc: 'Updated description'
            });
            const requestData = {
                title: 'Updated Blog Title',
                desc: 'Updated description'
            };

            blogController.updateBlog.mockImplementation((req, res) => {
                res.status(200).json({
                    success: true,
                    blog: updatedBlog
                });
            });

            const response = await request(app)
                .put(`/api/blog/update/${blogId}`)
                .send(requestData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(blogController.updateBlog).toHaveBeenCalled();
        });

        it('should handle blog not found', async () => {
            const nonExistentId = 'blog999';
            const requestData = { title: 'Updated Title' };

            blogController.updateBlog.mockImplementation((req, res) => {
                res.status(404).json({
                    success: false,
                    message: 'Blog not found'
                });
            });

            const response = await request(app)
                .put(`/api/blog/update/${nonExistentId}`)
                .send(requestData);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should handle unauthorized update attempt', async () => {
            const blogId = 'blog123';
            const requestData = { title: 'Unauthorized Update' };

            blogController.updateBlog.mockImplementation((req, res) => {
                res.status(403).json({
                    success: false,
                    message: 'Unauthorized to update this blog'
                });
            });

            const response = await request(app)
                .put(`/api/blog/update/${blogId}`)
                .send(requestData);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/blog/:id', () => {
        it('should get a blog by ID successfully', async () => {
            const blogId = 'blog123';
            const mockBlog = createMockBlog();

            blogController.getById.mockImplementation((req, res) => {
                res.status(200).json({
                    success: true,
                    blog: mockBlog
                });
            });

            const response = await request(app).get(`/api/blog/${blogId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(blogController.getById).toHaveBeenCalled();
        });

        it('should handle blog not found', async () => {
            const nonExistentId = 'blog999';

            blogController.getById.mockImplementation((req, res) => {
                res.status(404).json({
                    success: false,
                    message: 'Blog not found'
                });
            });

            const response = await request(app).get(`/api/blog/${nonExistentId}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/blog/:id', () => {
        it('should delete a blog successfully', async () => {
            const blogId = 'blog123';

            blogController.deleteBlog.mockImplementation((req, res) => {
                res.status(200).json({
                    success: true,
                    message: 'Blog deleted successfully'
                });
            });

            const response = await request(app).delete(`/api/blog/${blogId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(blogController.deleteBlog).toHaveBeenCalled();
        });

        it('should handle blog not found for deletion', async () => {
            const nonExistentId = 'blog999';

            blogController.deleteBlog.mockImplementation((req, res) => {
                res.status(404).json({
                    success: false,
                    message: 'Blog not found'
                });
            });

            const response = await request(app).delete(`/api/blog/${nonExistentId}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should handle unauthorized deletion attempt', async () => {
            const blogId = 'blog123';

            blogController.deleteBlog.mockImplementation((req, res) => {
                res.status(403).json({
                    success: false,
                    message: 'Unauthorized to delete this blog'
                });
            });

            const response = await request(app).delete(`/api/blog/${blogId}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/blog/user/:userId', () => {
        it('should get all blogs by user ID successfully', async () => {
            const userId = 'user123';
            const userBlogs = [
                createMockBlog(),
                createMockBlog({ _id: 'blog456', title: 'User Second Blog' })
            ];

            blogController.getByUserId.mockImplementation((req, res) => {
                res.status(200).json({
                    success: true,
                    blogs: userBlogs
                });
            });

            const response = await request(app).get(`/api/blog/user/${userId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.blogs).toHaveLength(2);
            expect(blogController.getByUserId).toHaveBeenCalled();
        });

        it('should handle user with no blogs', async () => {
            const userId = 'user456';

            blogController.getByUserId.mockImplementation((req, res) => {
                res.status(200).json({
                    success: true,
                    blogs: []
                });
            });

            const response = await request(app).get(`/api/blog/user/${userId}`);

            expect(response.status).toBe(200);
            expect(response.body.blogs).toEqual([]);
        });

        it('should handle user not found', async () => {
            const nonExistentUserId = 'user999';

            blogController.getByUserId.mockImplementation((req, res) => {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            });

            const response = await request(app).get(`/api/blog/user/${nonExistentUserId}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Security Tests', () => {
        it('should handle XSS attempts in blog content', async () => {
            const requestData = createMockBlogRequest({
                title: '<script>alert("xss")</script>Blog Title',
                desc: '<img src="x" onerror="alert(\'xss\')">Description'
            });

            blogController.addBlog.mockImplementation((req, res) => {
                res.status(201).json({
                    success: true,
                    blog: createMockBlog()
                });
            });

            const response = await request(app)
                .post('/api/blog/add')
                .send(requestData);

            expect(response.status).toBe(201);
            expect(blogController.addBlog).toHaveBeenCalled();
        });

        it('should handle malformed JSON requests', async () => {
            const response = await request(app)
                .post('/api/blog/add')
                .set('Content-Type', 'application/json')
                .send('{"invalid": "json"');

            expect(response.status).toBe(400);
        });
    });

    describe('Invalid Routes', () => {
        it('should handle invalid route paths', async () => {
            const response = await request(app).get('/api/blog/invalid/route');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Route not found');
        });
    });
});
