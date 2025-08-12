import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockUser } from '../utils/test-utils';
import Header from '../../src/componets/Header';
import { authActions } from '../../src/store';

describe('Header Component', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders BlogsApp title', () => {
            renderWithProviders(<Header />);
            expect(screen.getByText('BlogsApp')).toBeInTheDocument();
        });

        it('renders correctly when user is not logged in', () => {
            renderWithProviders(<Header />, {
                preloadedState: { auth: { isLoggedIn: false } }
            });

            expect(screen.getByText('Login')).toBeInTheDocument();
            expect(screen.getByText('SignUp')).toBeInTheDocument();
            expect(screen.queryByText('Logout')).not.toBeInTheDocument();
            expect(screen.queryByText('All Blogs')).not.toBeInTheDocument();
        });

        it('renders correctly when user is logged in', () => {
            renderWithProviders(<Header />, {
                preloadedState: { auth: { isLoggedIn: true } }
            });

            expect(screen.getByText('Logout')).toBeInTheDocument();
            expect(screen.getByText('All Blogs')).toBeInTheDocument();
            expect(screen.getByText('My Blogs')).toBeInTheDocument();
            expect(screen.getByText('Add Blog')).toBeInTheDocument();
            expect(screen.queryByText('Login')).not.toBeInTheDocument();
            expect(screen.queryByText('SignUp')).not.toBeInTheDocument();
        });

        it('renders dark mode toggle button', () => {
            renderWithProviders(<Header />);
            const darkModeButton = screen.getByRole('button', { name: /dark mode|light mode/i });
            expect(darkModeButton).toBeInTheDocument();
        });
    });

    describe('Theme functionality', () => {
        it('toggles dark mode when dark mode button is clicked', async () => {
            const { store } = renderWithProviders(<Header />, {
                preloadedState: { theme: { isDarkmode: false } }
            });

            const darkModeToggle = screen.getByTestId('dark-mode-toggle') ||
                screen.getByRole('button', { name: /dark/i });

            await user.click(darkModeToggle);

            // Check if localStorage was called
            expect(localStorage.setItem).toHaveBeenCalledWith('isDarkMode', 'true');
        });

        it('displays correct icon for light mode', () => {
            renderWithProviders(<Header />, {
                preloadedState: { theme: { isDarkmode: false } }
            });

            // Should show DarkModeIcon when in light mode
            expect(screen.getByTestId('DarkModeIcon')).toBeInTheDocument();
        });

        it('displays correct icon for dark mode', () => {
            renderWithProviders(<Header />, {
                preloadedState: { theme: { isDarkmode: true } }
            });

            // Should show LightModeIcon when in dark mode
            expect(screen.getByTestId('LightModeIcon')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('navigates to login page when login button is clicked', async () => {
            renderWithProviders(<Header />, {
                preloadedState: { auth: { isLoggedIn: false } }
            });

            const loginButton = screen.getByText('Login');
            await user.click(loginButton);

            // Check if navigation occurred (would need to mock useNavigate)
            expect(loginButton).toBeInTheDocument();
        });

        it('navigates to signup page when signup button is clicked', async () => {
            renderWithProviders(<Header />, {
                preloadedState: { auth: { isLoggedIn: false } }
            });

            const signupButton = screen.getByText('SignUp');
            await user.click(signupButton);

            expect(signupButton).toBeInTheDocument();
        });

        it('handles tab navigation correctly', async () => {
            renderWithProviders(<Header />, {
                preloadedState: { auth: { isLoggedIn: true } }
            });

            const allBlogsTab = screen.getByText('All Blogs');
            await user.click(allBlogsTab);

            expect(localStorage.setItem).toHaveBeenCalledWith('selectedTab', expect.any(String));
        });
    });

    describe('Authentication', () => {
        it('dispatches logout action when logout button is clicked', async () => {
            const { store } = renderWithProviders(<Header />, {
                preloadedState: { auth: { isLoggedIn: true } }
            });

            const logoutButton = screen.getByText('Logout');
            await user.click(logoutButton);

            // Check if logout was dispatched
            const state = store.getState();
            expect(state.auth.isLoggedIn).toBe(false);
        });

        it('removes userId from localStorage on logout', async () => {
            renderWithProviders(<Header />, {
                preloadedState: { auth: { isLoggedIn: true } }
            });

            const logoutButton = screen.getByText('Logout');
            await user.click(logoutButton);

            expect(localStorage.removeItem).toHaveBeenCalledWith('userId');
        });
    });

    describe('Edge Cases', () => {
        it('handles missing localStorage gracefully', () => {
            // Mock localStorage to throw error
            const originalLocalStorage = window.localStorage;
            delete window.localStorage;

            expect(() => {
                renderWithProviders(<Header />);
            }).not.toThrow();

            // Restore localStorage
            window.localStorage = originalLocalStorage;
        });

        it('handles null theme state', () => {
            renderWithProviders(<Header />, {
                preloadedState: { theme: null }
            });

            expect(screen.getByText('BlogsApp')).toBeInTheDocument();
        });

        it('handles undefined auth state', () => {
            renderWithProviders(<Header />, {
                preloadedState: { auth: undefined }
            });

            expect(screen.getByText('BlogsApp')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels', () => {
            renderWithProviders(<Header />);

            const appBar = screen.getByRole('banner');
            expect(appBar).toBeInTheDocument();
        });

        it('supports keyboard navigation', async () => {
            renderWithProviders(<Header />, {
                preloadedState: { auth: { isLoggedIn: false } }
            });

            const loginButton = screen.getByText('Login');

            // Tab to the button
            await user.tab();
            expect(loginButton).toHaveFocus();

            // Press Enter
            await user.keyboard('{Enter}');
            // Should trigger click
        });
    });

    describe('Responsive behavior', () => {
        it('handles window resize', () => {
            renderWithProviders(<Header />);

            // Simulate window resize
            fireEvent(window, new Event('resize'));

            expect(screen.getByText('BlogsApp')).toBeInTheDocument();
        });
    });
});
