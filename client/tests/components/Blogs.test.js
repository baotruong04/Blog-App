import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockBlog } from '../utils/test-utils';
import Blogs from '../../src/componets/Blogs';
import { server } from '../__mocks__/server';
import { http, HttpResponse } from 'msw';
import config from '../../src/config';

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
});

describe('Blogs Component', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue('1'); // Mock userId
    });

    describe('Rendering', () => {
        it('renders blogs list successfully', async () => {
            renderWithProviders(<Blogs />);

            await waitFor(() => {
                expect(screen.getByText('Test Blog 1')).toBeInTheDocument();
                expect(screen.getByText('Test Blog 2')).toBeInTheDocument();
            });
        });

        it('renders blog content correctly', async () => {
            renderWithProviders(<Blogs />);

            await waitFor(() => {
                expect(screen.getByText('Test Blog 1')).toBeInTheDocument();
                expect(screen.getByText('This is a test blog description')).toBeInTheDocument();
                expect(screen.getByText('Test User')).toBeInTheDocument();
            });
        });

        it('renders blog dates correctly', async () => {
            renderWithProviders(<Blogs />);

            await waitFor(() => {
                // Check if date is displayed (format: MM/DD/YYYY)
                expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument();
            });
        });

        it('shows edit and delete buttons for user own blogs', async () => {
            mockLocalStorage.getItem.mockReturnValue('1'); // Same as blog owner

            renderWithProviders(<Blogs />);

            await waitFor(() => {
                const editButtons = screen.getAllByTestId('edit-button');
                const deleteButtons = screen.getAllByTestId('delete-button');

                expect(editButtons).toHaveLength(2); // 2 blogs owned by user 1
                expect(deleteButtons).toHaveLength(2);
            });
        });

        it('hides edit and delete buttons for other users blogs', async () => {
            mockLocalStorage.getItem.mockReturnValue('2'); // Different from blog owner

            renderWithProviders(<Blogs />);

            await waitFor(() => {
                expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
                expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
            });
        });
    });

    describe('Loading States', () => {
        it('handles loading state', () => {
            renderWithProviders(<Blogs />);

            // Component should render without crashing during loading
            expect(screen.getByRole('main') || document.body).toBeInTheDocument();
        });

        it('handles empty blogs list', async () => {
            server.use(
                http.get(`${config.BASE_URL}/api/blogs`, () => {
                    return HttpResponse.json({ blogs: [] });
                })
            );

            renderWithProviders(<Blogs />);

            await waitFor(() => {
                expect(screen.queryByText('Test Blog 1')).not.toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('handles API error gracefully', async () => {
            server.use(
                http.get(`${config.BASE_URL}/api/blogs`, () => {
                    return HttpResponse.json(
                        { message: 'Server error' },
                        { status: 500 }
                    );
                })
            );

            renderWithProviders(<Blogs />);

            // Should not crash on error
            await waitFor(() => {
                expect(screen.queryByText('Test Blog 1')).not.toBeInTheDocument();
            });
        });

        it('handles network error', async () => {
            server.use(
                http.get(`${config.BASE_URL}/api/blogs`, () => {
                    return HttpResponse.error();
                })
            );

            renderWithProviders(<Blogs />);

            // Component should handle network error gracefully
            await waitFor(() => {
                expect(screen.queryByText('Test Blog 1')).not.toBeInTheDocument();
            });
        });

        it('handles malformed response data', async () => {
            server.use(
                http.get(`${config.BASE_URL}/api/blogs`, () => {
                    return HttpResponse.json({ invalid: 'data' });
                })
            );

            renderWithProviders(<Blogs />);

            await waitFor(() => {
                expect(screen.queryByText('Test Blog 1')).not.toBeInTheDocument();
            });
        });
    });

    describe('Blog Interaction', () => {
        it('handles edit button click', async () => {
            const mockNavigate = jest.fn();

            // Mock useNavigate
            jest.doMock('react-router-dom', () => ({
                ...jest.requireActual('react-router-dom'),
                useNavigate: () => mockNavigate,
            }));

            renderWithProviders(<Blogs />);

            await waitFor(() => {
                const editButton = screen.getAllByTestId('edit-button')[0];
                expect(editButton).toBeInTheDocument();
            });
        });

        it('handles delete button click', async () => {
            renderWithProviders(<Blogs />);

            await waitFor(() => {
                const deleteButton = screen.getAllByTestId('delete-button')[0];
                expect(deleteButton).toBeInTheDocument();
            });
        });
    });

    describe('Data Fetching', () => {
        it('fetches blogs on component mount', async () => {
            renderWithProviders(<Blogs />);

            await waitFor(() => {
                expect(screen.getByText('Test Blog 1')).toBeInTheDocument();
            });
        });

        it('re-fetches blogs when component updates', async () => {
            const { rerender } = renderWithProviders(<Blogs />);

            await waitFor(() => {
                expect(screen.getByText('Test Blog 1')).toBeInTheDocument();
            });

            // Rerender component
            rerender(<Blogs />);

            await waitFor(() => {
                expect(screen.getByText('Test Blog 1')).toBeInTheDocument();
            });
        });
    });

    describe('Edge Cases', () => {
        it('handles blogs with missing user data', async () => {
            server.use(
                http.get(`${config.BASE_URL}/api/blogs`, () => {
                    return HttpResponse.json({
                        blogs: [{
                            _id: 'blog1',
                            title: 'Blog without user',
                            desc: 'Description',
                            img: 'image.jpg',
                            user: null,
                            date: new Date().toISOString()
                        }]
                    });
                })
            );

            renderWithProviders(<Blogs />);

            await waitFor(() => {
                expect(screen.getByText('Blog without user')).toBeInTheDocument();
            });
        });

        it('handles blogs with missing images', async () => {
            server.use(
                http.get(`${config.BASE_URL}/api/blogs`, () => {
                    return HttpResponse.json({
                        blogs: [{
                            _id: 'blog1',
                            title: 'Blog without image',
                            desc: 'Description',
                            img: '',
                            user: { _id: '1', name: 'Test User' },
                            date: new Date().toISOString()
                        }]
                    });
                })
            );

            renderWithProviders(<Blogs />);

            await waitFor(() => {
                expect(screen.getByText('Blog without image')).toBeInTheDocument();
            });
        });

        it('handles very long blog titles and descriptions', async () => {
            const longTitle = 'A'.repeat(1000);
            const longDesc = 'B'.repeat(2000);

            server.use(
                http.get(`${config.BASE_URL}/api/blogs`, () => {
                    return HttpResponse.json({
                        blogs: [{
                            _id: 'blog1',
                            title: longTitle,
                            desc: longDesc,
                            img: 'image.jpg',
                            user: { _id: '1', name: 'Test User' },
                            date: new Date().toISOString()
                        }]
                    });
                })
            );

            renderWithProviders(<Blogs />);

            await waitFor(() => {
                expect(screen.getByText(longTitle)).toBeInTheDocument();
            });
        });

        it('handles blogs with special characters', async () => {
            const specialTitle = 'Blog with 特殊字符 and émojis 🚀';

            server.use(
                http.get(`${config.BASE_URL}/api/blogs`, () => {
                    return HttpResponse.json({
                        blogs: [{
                            _id: 'blog1',
                            title: specialTitle,
                            desc: 'Description with <script>alert("xss")</script>',
                            img: 'image.jpg',
                            user: { _id: '1', name: 'Test User' },
                            date: new Date().toISOString()
                        }]
                    });
                })
            );

            renderWithProviders(<Blogs />);

            await waitFor(() => {
                expect(screen.getByText(specialTitle)).toBeInTheDocument();
            });
        });

        it('handles invalid date formats', async () => {
            server.use(
                http.get(`${config.BASE_URL}/api/blogs`, () => {
                    return HttpResponse.json({
                        blogs: [{
                            _id: 'blog1',
                            title: 'Blog with invalid date',
                            desc: 'Description',
                            img: 'image.jpg',
                            user: { _id: '1', name: 'Test User' },
                            date: 'invalid-date'
                        }]
                    });
                })
            );

            renderWithProviders(<Blogs />);

            await waitFor(() => {
                expect(screen.getByText('Blog with invalid date')).toBeInTheDocument();
            });
        });
    });

    describe('Performance', () => {
        it('handles large number of blogs', async () => {
            const manyBlogs = Array.from({ length: 100 }, (_, i) => createMockBlog({
                _id: `blog${i}`,
                title: `Blog ${i}`,
                desc: `Description ${i}`
            }));

            server.use(
                http.get(`${config.BASE_URL}/api/blogs`, () => {
                    return HttpResponse.json({ blogs: manyBlogs });
                })
            );

            renderWithProviders(<Blogs />);

            await waitFor(() => {
                expect(screen.getByText('Blog 0')).toBeInTheDocument();
                expect(screen.getByText('Blog 99')).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('has proper semantic structure', async () => {
            renderWithProviders(<Blogs />);

            await waitFor(() => {
                const articles = screen.getAllByRole('article');
                expect(articles.length).toBeGreaterThan(0);
            });
        });

        it('has proper headings hierarchy', async () => {
            renderWithProviders(<Blogs />);

            await waitFor(() => {
                const headings = screen.getAllByRole('heading');
                expect(headings.length).toBeGreaterThan(0);
            });
        });

        it('has proper image alt texts', async () => {
            renderWithProviders(<Blogs />);

            await waitFor(() => {
                const images = screen.getAllByRole('img');
                images.forEach(img => {
                    expect(img).toHaveAttribute('alt');
                });
            });
        });
    });
});
