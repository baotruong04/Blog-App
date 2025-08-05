import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import config from '../../src/config';

const mockUsers = [
    {
        _id: '1',
        name: 'Test User',
        email: 'test@example.com',
        blogs: ['blog1', 'blog2']
    },
    {
        _id: '2',
        name: 'Another User',
        email: 'another@example.com',
        blogs: []
    }
];

const mockBlogs = [
    {
        _id: 'blog1',
        title: 'Test Blog 1',
        desc: 'This is a test blog description',
        img: 'https://example.com/image1.jpg',
        user: {
            _id: '1',
            name: 'Test User'
        },
        date: new Date('2024-01-01').toISOString()
    },
    {
        _id: 'blog2',
        title: 'Test Blog 2',
        desc: 'Another test blog description',
        img: 'https://example.com/image2.jpg',
        user: {
            _id: '1',
            name: 'Test User'
        },
        date: new Date('2024-01-02').toISOString()
    }
];

export const handlers = [
    // User endpoints
    http.get(`${config.BASE_URL}/api/users`, () => {
        return HttpResponse.json({ users: mockUsers });
    }),

    http.post(`${config.BASE_URL}/api/users/signup`, async ({ request }) => {
        const body = await request.json();
        const { name, email, password } = body;

        // Validation
        if (!name || !email || !password) {
            return HttpResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return HttpResponse.json(
                { message: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Check if user exists
        if (mockUsers.find(user => user.email === email)) {
            return HttpResponse.json(
                { message: 'User is already exists!' },
                { status: 400 }
            );
        }

        const newUser = {
            _id: Date.now().toString(),
            name,
            email,
            blogs: []
        };

        return HttpResponse.json({ user: newUser }, { status: 201 });
    }),

    http.post(`${config.BASE_URL}/api/users/login`, async ({ request }) => {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return HttpResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        const user = mockUsers.find(u => u.email === email);
        if (!user) {
            return HttpResponse.json(
                { message: 'User is not found' },
                { status: 404 }
            );
        }

        // Simulate password check
        if (password === 'wrongpassword') {
            return HttpResponse.json(
                { message: 'Incorrect Password!' },
                { status: 400 }
            );
        }

        return HttpResponse.json({ user });
    }),

    // Blog endpoints
    http.get(`${config.BASE_URL}/api/blogs`, () => {
        return HttpResponse.json({ blogs: mockBlogs });
    }),

    http.get(`${config.BASE_URL}/api/blogs/:id`, ({ params }) => {
        const blog = mockBlogs.find(b => b._id === params.id);
        if (!blog) {
            return HttpResponse.json(
                { message: 'not found' },
                { status: 500 }
            );
        }
        return HttpResponse.json({ blog });
    }),

    http.post(`${config.BASE_URL}/api/blogs/add`, async ({ request }) => {
        const body = await request.json();
        const { title, desc, img, user } = body;

        if (!title || !desc || !user) {
            return HttpResponse.json(
                { message: 'All fields are required' },
                { status: 400 }
            );
        }

        const newBlog = {
            _id: Date.now().toString(),
            title,
            desc,
            img: img || 'placeholder.jpg',
            user: {
                _id: user,
                name: 'Test User'
            },
            date: new Date().toISOString()
        };

        return HttpResponse.json({ blog: newBlog });
    }),

    http.put(`${config.BASE_URL}/api/blogs/update/:id`, async ({ params, request }) => {
        const body = await request.json();
        const { title, desc } = body;

        if (!title || !desc) {
            return HttpResponse.json(
                { message: 'Title and description are required' },
                { status: 400 }
            );
        }

        const blog = mockBlogs.find(b => b._id === params.id);
        if (!blog) {
            return HttpResponse.json(
                { message: 'Unable to update' },
                { status: 500 }
            );
        }

        const updatedBlog = { ...blog, title, desc };
        return HttpResponse.json({ blog: updatedBlog });
    }),

    http.delete(`${config.BASE_URL}/api/blogs/:id`, ({ params }) => {
        const blog = mockBlogs.find(b => b._id === params.id);
        if (!blog) {
            return HttpResponse.json(
                { message: 'Blog not found' },
                { status: 404 }
            );
        }
        return HttpResponse.json({ message: 'Successfully deleted' });
    }),

    http.get(`${config.BASE_URL}/api/blogs/user/:id`, ({ params }) => {
        const user = mockUsers.find(u => u._id === params.id);
        if (!user) {
            return HttpResponse.json(
                { message: 'No Blog Found' },
                { status: 404 }
            );
        }

        const userBlogs = mockBlogs.filter(blog => blog.user._id === params.id);
        const userWithBlogs = { ...user, blogs: userBlogs };
        return HttpResponse.json({ user: userWithBlogs });
    }),

    // Network error simulation
    http.get(`${config.BASE_URL}/api/error`, () => {
        return HttpResponse.error();
    })
];

export const server = setupServer(...handlers);
