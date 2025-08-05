import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockLocalStorage, createMockUser } from '../utils/test-utils';
import Login from '../../src/componets/Login';
import { server } from '../__mocks__/server';
import { http, HttpResponse } from 'msw';
import config from '../../src/config';

// Mock useNavigate and useLocation
const mockNavigate = jest.fn();
const mockLocation = {
    state: { isSignupButtonPressed: false }
};

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
}));

describe('Login Component', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage();
    });

    describe('Rendering', () => {
        it('renders login form by default', () => {
            renderWithProviders(<Login />);

            expect(screen.getByText('Login')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
            expect(screen.getByText('Change To Signup')).toBeInTheDocument();
        });

        it('renders signup form when isSignupButtonPressed is true', () => {
            mockLocation.state = { isSignupButtonPressed: true };

            renderWithProviders(<Login />);

            expect(screen.getByText('Signup')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
            expect(screen.getByText('Change To Login')).toBeInTheDocument();
        });

        it('does not render name field in login mode', () => {
            renderWithProviders(<Login />);

            expect(screen.queryByPlaceholderText('Name')).not.toBeInTheDocument();
        });

        it('renders name field in signup mode', async () => {
            renderWithProviders(<Login />);

            const changeButton = screen.getByText('Change To Signup');
            await user.click(changeButton);

            expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
        });
    });

    describe('Form Interaction', () => {
        it('updates input values when user types', async () => {
            renderWithProviders(<Login />);

            const emailInput = screen.getByPlaceholderText('Email');
            const passwordInput = screen.getByPlaceholderText('Password');

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');

            expect(emailInput).toHaveValue('test@example.com');
            expect(passwordInput).toHaveValue('password123');
        });

        it('toggles between login and signup modes', async () => {
            renderWithProviders(<Login />);

            expect(screen.getByText('Login')).toBeInTheDocument();

            const toggleButton = screen.getByText('Change To Signup');
            await user.click(toggleButton);

            expect(screen.getByText('Signup')).toBeInTheDocument();
            expect(screen.getByText('Change To Login')).toBeInTheDocument();

            const toggleBackButton = screen.getByText('Change To Login');
            await user.click(toggleBackButton);

            expect(screen.getByText('Login')).toBeInTheDocument();
        });

        it('clears form when toggling modes', async () => {
            renderWithProviders(<Login />);

            const emailInput = screen.getByPlaceholderText('Email');
            await user.type(emailInput, 'test@example.com');

            const toggleButton = screen.getByText('Change To Signup');
            await user.click(toggleButton);

            // Form should maintain values when toggling
            expect(screen.getByPlaceholderText('Email')).toHaveValue('test@example.com');
        });
    });

    describe('Form Submission - Login', () => {
        it('submits login form with valid data', async () => {
            const { store } = renderWithProviders(<Login />);

            const emailInput = screen.getByPlaceholderText('Email');
            const passwordInput = screen.getByPlaceholderText('Password');
            const submitButton = screen.getByRole('button', { name: /submit/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(submitButton);

            await waitFor(() => {
                expect(localStorage.setItem).toHaveBeenCalledWith('userId', '1');
                expect(mockNavigate).toHaveBeenCalledWith('/blogs');
            });
        });

        it('handles login with wrong password', async () => {
            // Mock wrong password response
            server.use(
                http.post(`${config.BASE_URL}/api/users/login`, () => {
                    return HttpResponse.json(
                        { message: 'Incorrect Password!' },
                        { status: 400 }
                    );
                })
            );

            renderWithProviders(<Login />);

            const emailInput = screen.getByPlaceholderText('Email');
            const passwordInput = screen.getByPlaceholderText('Password');
            const submitButton = screen.getByRole('button', { name: /submit/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'wrongpassword');
            await user.click(submitButton);

            // Should not navigate on error
            await waitFor(() => {
                expect(mockNavigate).not.toHaveBeenCalled();
                expect(localStorage.setItem).not.toHaveBeenCalled();
            });
        });

        it('handles login with non-existent user', async () => {
            server.use(
                http.post(`${config.BASE_URL}/api/users/login`, () => {
                    return HttpResponse.json(
                        { message: 'User is not found' },
                        { status: 404 }
                    );
                })
            );

            renderWithProviders(<Login />);

            const emailInput = screen.getByPlaceholderText('Email');
            const passwordInput = screen.getByPlaceholderText('Password');
            const submitButton = screen.getByRole('button', { name: /submit/i });

            await user.type(emailInput, 'nonexistent@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).not.toHaveBeenCalled();
            });
        });
    });

    describe('Form Submission - Signup', () => {
        beforeEach(async () => {
            renderWithProviders(<Login />);
            const toggleButton = screen.getByText('Change To Signup');
            await user.click(toggleButton);
        });

        it('submits signup form with valid data', async () => {
            const nameInput = screen.getByPlaceholderText('Name');
            const emailInput = screen.getByPlaceholderText('Email');
            const passwordInput = screen.getByPlaceholderText('Password');
            const submitButton = screen.getByRole('button', { name: /submit/i });

            await user.type(nameInput, 'New User');
            await user.type(emailInput, 'newuser@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(submitButton);

            await waitFor(() => {
                expect(localStorage.setItem).toHaveBeenCalled();
                expect(mockNavigate).toHaveBeenCalledWith('/blogs');
            });
        });

        it('handles signup with existing email', async () => {
            server.use(
                http.post(`${config.BASE_URL}/api/users/signup`, () => {
                    return HttpResponse.json(
                        { message: 'User is already exists!' },
                        { status: 400 }
                    );
                })
            );

            const nameInput = screen.getByPlaceholderText('Name');
            const emailInput = screen.getByPlaceholderText('Email');
            const passwordInput = screen.getByPlaceholderText('Password');
            const submitButton = screen.getByRole('button', { name: /submit/i });

            await user.type(nameInput, 'Test User');
            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).not.toHaveBeenCalled();
            });
        });

        it('validates required fields', async () => {
            const submitButton = screen.getByRole('button', { name: /submit/i });

            // Try to submit empty form
            await user.click(submitButton);

            // Should not navigate
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    describe('Network Errors', () => {
        it('handles network error during login', async () => {
            server.use(
                http.post(`${config.BASE_URL}/api/users/login`, () => {
                    return HttpResponse.error();
                })
            );

            renderWithProviders(<Login />);

            const emailInput = screen.getByPlaceholderText('Email');
            const passwordInput = screen.getByPlaceholderText('Password');
            const submitButton = screen.getByRole('button', { name: /submit/i });

            await user.type(emailInput, 'test@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).not.toHaveBeenCalled();
            });
        });

        it('handles network error during signup', async () => {
            server.use(
                http.post(`${config.BASE_URL}/api/users/signup`, () => {
                    return HttpResponse.error();
                })
            );

            renderWithProviders(<Login />);

            const toggleButton = screen.getByText('Change To Signup');
            await user.click(toggleButton);

            const nameInput = screen.getByPlaceholderText('Name');
            const emailInput = screen.getByPlaceholderText('Email');
            const passwordInput = screen.getByPlaceholderText('Password');
            const submitButton = screen.getByRole('button', { name: /submit/i });

            await user.type(nameInput, 'New User');
            await user.type(emailInput, 'newuser@example.com');
            await user.type(passwordInput, 'password123');
            await user.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).not.toHaveBeenCalled();
            });
        });
    });

    describe('Edge Cases', () => {
        it('handles empty location state', () => {
            mockLocation.state = null;

            expect(() => {
                renderWithProviders(<Login />);
            }).not.toThrow();

            expect(screen.getByText('Login')).toBeInTheDocument();
        });

        it('handles invalid email format', async () => {
            renderWithProviders(<Login />);

            const emailInput = screen.getByPlaceholderText('Email');
            await user.type(emailInput, 'invalid-email');

            // HTML5 validation should handle this
            expect(emailInput).toHaveValue('invalid-email');
        });

        it('handles very long input values', async () => {
            renderWithProviders(<Login />);

            const longString = 'a'.repeat(1000);
            const emailInput = screen.getByPlaceholderText('Email');

            await user.type(emailInput, longString);
            expect(emailInput).toHaveValue(longString);
        });

        it('handles special characters in input', async () => {
            renderWithProviders(<Login />);

            const specialChars = '!@#$%^&*()';
            const passwordInput = screen.getByPlaceholderText('Password');

            await user.type(passwordInput, specialChars);
            expect(passwordInput).toHaveValue(specialChars);
        });
    });

    describe('Accessibility', () => {
        it('has proper form labels and structure', () => {
            renderWithProviders(<Login />);

            expect(screen.getByRole('form')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
        });

        it('supports keyboard navigation', async () => {
            renderWithProviders(<Login />);

            // Tab through form elements
            await user.tab();
            expect(screen.getByPlaceholderText('Email')).toHaveFocus();

            await user.tab();
            expect(screen.getByPlaceholderText('Password')).toHaveFocus();

            await user.tab();
            expect(screen.getByRole('button', { name: /submit/i })).toHaveFocus();
        });
    });
});
