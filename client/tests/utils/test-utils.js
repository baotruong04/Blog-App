import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '../../src/store';

// Mock store creator
export const createMockStore = (initialState = {}) => {
    const defaultState = {
        auth: { isLoggedIn: false },
        theme: { isDarkmode: false },
        ...initialState
    };

    return configureStore({
        reducer: {
            auth: authSlice.reducer,
            theme: (state = defaultState.theme) => state,
        },
        preloadedState: defaultState,
    });
};

// Custom render function with providers
export const renderWithProviders = (
    ui,
    {
        preloadedState = {},
        store = createMockStore(preloadedState),
        router = 'browser',
        initialEntries = ['/'],
        ...renderOptions
    } = {}
) => {
    const RouterComponent = router === 'memory' ? MemoryRouter : BrowserRouter;
    const routerProps = router === 'memory' ? { initialEntries } : {};

    function Wrapper({ children }) {
        return (
            <Provider store={store}>
                <RouterComponent {...routerProps}>
                    {children}
                </RouterComponent>
            </Provider>
        );
    }

    return {
        store,
        ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
    };
};

// Helper function to mock localStorage
export const mockLocalStorage = (items = {}) => {
    const localStorageMock = {
        getItem: jest.fn((key) => items[key] || null),
        setItem: jest.fn((key, value) => {
            items[key] = value;
        }),
        removeItem: jest.fn((key) => {
            delete items[key];
        }),
        clear: jest.fn(() => {
            Object.keys(items).forEach(key => delete items[key]);
        }),
    };

    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
    });

    return localStorageMock;
};

// Helper to create mock user
export const createMockUser = (overrides = {}) => ({
    _id: '1',
    name: 'Test User',
    email: 'test@example.com',
    blogs: [],
    ...overrides,
});

// Helper to create mock blog
export const createMockBlog = (overrides = {}) => ({
    _id: 'blog1',
    title: 'Test Blog',
    desc: 'Test description',
    img: 'test-image.jpg',
    user: {
        _id: '1',
        name: 'Test User',
    },
    date: new Date('2024-01-01').toISOString(),
    ...overrides,
});

// Wait for async operations
export const waitForLoadingToFinish = () =>
    new Promise(resolve => setTimeout(resolve, 0));

// Mock axios
export const createMockAxios = () => ({
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
});

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
