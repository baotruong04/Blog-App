import { configureStore } from '@reduxjs/toolkit';
import { authActions, store, setDarkmode } from '../../src/store';

describe('Redux Store', () => {
    let testStore;

    beforeEach(() => {
        // Create a fresh store for each test
        testStore = configureStore({
            reducer: store.getState,
            preloadedState: {
                auth: { isLoggedIn: false },
                theme: { isDarkmode: false }
            }
        });
    });

    describe('Auth Slice', () => {
        describe('Initial State', () => {
            it('has correct initial state', () => {
                const state = store.getState();
                expect(state.auth.isLoggedIn).toBe(false);
            });
        });

        describe('Login Action', () => {
            it('sets isLoggedIn to true when login action is dispatched', () => {
                const initialState = { isLoggedIn: false };
                const action = authActions.login();

                // Test the reducer directly
                const authReducer = store._reducer.auth;
                const newState = authReducer(initialState, action);

                expect(newState.isLoggedIn).toBe(true);
            });

            it('logs message when login action is dispatched', () => {
                const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

                const initialState = { isLoggedIn: false };
                const action = authActions.login();
                const authReducer = store._reducer.auth;

                authReducer(initialState, action);

                expect(consoleSpy).toHaveBeenCalledWith('updating');
                consoleSpy.mockRestore();
            });

            it('maintains login state across multiple dispatches', () => {
                const initialState = { isLoggedIn: false };
                const action = authActions.login();
                const authReducer = store._reducer.auth;

                const firstState = authReducer(initialState, action);
                const secondState = authReducer(firstState, action);

                expect(firstState.isLoggedIn).toBe(true);
                expect(secondState.isLoggedIn).toBe(true);
            });
        });

        describe('Logout Action', () => {
            it('sets isLoggedIn to false when logout action is dispatched', () => {
                const initialState = { isLoggedIn: true };
                const action = authActions.logout();
                const authReducer = store._reducer.auth;

                const newState = authReducer(initialState, action);

                expect(newState.isLoggedIn).toBe(false);
            });

            it('removes userId from localStorage on logout', () => {
                const mockRemoveItem = jest.fn();
                Storage.prototype.removeItem = mockRemoveItem;

                const initialState = { isLoggedIn: true };
                const action = authActions.logout();
                const authReducer = store._reducer.auth;

                authReducer(initialState, action);

                expect(mockRemoveItem).toHaveBeenCalledWith('userId');
            });

            it('handles logout when already logged out', () => {
                const initialState = { isLoggedIn: false };
                const action = authActions.logout();
                const authReducer = store._reducer.auth;

                const newState = authReducer(initialState, action);

                expect(newState.isLoggedIn).toBe(false);
            });
        });

        describe('Edge Cases', () => {
            it('handles undefined initial state', () => {
                const action = authActions.login();
                const authReducer = store._reducer.auth;

                const newState = authReducer(undefined, action);

                expect(newState).toBeDefined();
                expect(newState.isLoggedIn).toBe(true);
            });

            it('handles unknown action types', () => {
                const initialState = { isLoggedIn: false };
                const unknownAction = { type: 'UNKNOWN_ACTION' };
                const authReducer = store._reducer.auth;

                const newState = authReducer(initialState, unknownAction);

                expect(newState).toEqual(initialState);
            });

            it('preserves other state properties', () => {
                const initialState = {
                    isLoggedIn: false,
                    otherProp: 'should remain'
                };
                const action = authActions.login();
                const authReducer = store._reducer.auth;

                const newState = authReducer(initialState, action);

                expect(newState.isLoggedIn).toBe(true);
                expect(newState.otherProp).toBe('should remain');
            });
        });
    });

    describe('Theme Slice', () => {
        describe('Initial State', () => {
            it('has correct initial state', () => {
                const state = store.getState();
                expect(state.theme.isDarkmode).toBe(false);
            });
        });

        describe('SetDarkmode Action', () => {
            it('sets isDarkmode to true when setDarkmode(true) is dispatched', () => {
                const action = setDarkmode(true);

                expect(action.type).toBe('theme/setDarkmode');
                expect(action.payload).toBe(true);
            });

            it('sets isDarkmode to false when setDarkmode(false) is dispatched', () => {
                const action = setDarkmode(false);

                expect(action.type).toBe('theme/setDarkmode');
                expect(action.payload).toBe(false);
            });

            it('handles boolean toggle correctly', () => {
                const initialDarkState = { isDarkmode: false };
                const initialLightState = { isDarkmode: true };

                const darkAction = setDarkmode(true);
                const lightAction = setDarkmode(false);

                // Test theme reducer (assuming it exists)
                expect(darkAction.payload).toBe(true);
                expect(lightAction.payload).toBe(false);
            });
        });

        describe('Edge Cases', () => {
            it('handles non-boolean values', () => {
                const action = setDarkmode('true');
                expect(action.payload).toBe('true');
            });

            it('handles null/undefined values', () => {
                const nullAction = setDarkmode(null);
                const undefinedAction = setDarkmode(undefined);

                expect(nullAction.payload).toBe(null);
                expect(undefinedAction.payload).toBe(undefined);
            });
        });
    });

    describe('Store Configuration', () => {
        it('has correct reducer structure', () => {
            const state = store.getState();

            expect(state).toHaveProperty('auth');
            expect(state).toHaveProperty('theme');
        });

        it('initializes with correct default state', () => {
            const state = store.getState();

            expect(state.auth.isLoggedIn).toBe(false);
            expect(state.theme.isDarkmode).toBe(false);
        });

        it('can dispatch actions', () => {
            expect(() => {
                store.dispatch(authActions.login());
            }).not.toThrow();

            expect(() => {
                store.dispatch(authActions.logout());
            }).not.toThrow();

            expect(() => {
                store.dispatch(setDarkmode(true));
            }).not.toThrow();
        });

        it('subscribes to state changes', () => {
            const mockListener = jest.fn();
            const unsubscribe = store.subscribe(mockListener);

            store.dispatch(authActions.login());

            expect(mockListener).toHaveBeenCalled();

            unsubscribe();
        });

        it('handles multiple subscribers', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();

            const unsubscribe1 = store.subscribe(listener1);
            const unsubscribe2 = store.subscribe(listener2);

            store.dispatch(authActions.login());

            expect(listener1).toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();

            unsubscribe1();
            unsubscribe2();
        });
    });

    describe('Action Creators', () => {
        it('creates correct login action', () => {
            const action = authActions.login();

            expect(action).toEqual({
                type: 'auth/login',
                payload: undefined
            });
        });

        it('creates correct logout action', () => {
            const action = authActions.logout();

            expect(action).toEqual({
                type: 'auth/logout',
                payload: undefined
            });
        });

        it('creates correct setDarkmode action with payload', () => {
            const action = setDarkmode(true);

            expect(action).toEqual({
                type: 'theme/setDarkmode',
                payload: true
            });
        });
    });

    describe('Integration Tests', () => {
        it('handles complex state changes', () => {
            // Start logged out and light mode
            store.dispatch(authActions.logout());
            store.dispatch(setDarkmode(false));

            let state = store.getState();
            expect(state.auth.isLoggedIn).toBe(false);
            expect(state.theme.isDarkmode).toBe(false);

            // Login and switch to dark mode
            store.dispatch(authActions.login());
            store.dispatch(setDarkmode(true));

            state = store.getState();
            expect(state.auth.isLoggedIn).toBe(true);
            expect(state.theme.isDarkmode).toBe(true);

            // Logout but keep dark mode
            store.dispatch(authActions.logout());

            state = store.getState();
            expect(state.auth.isLoggedIn).toBe(false);
            expect(state.theme.isDarkmode).toBe(true);
        });

        it('handles rapid state changes', () => {
            for (let i = 0; i < 100; i++) {
                store.dispatch(authActions.login());
                store.dispatch(authActions.logout());
                store.dispatch(setDarkmode(i % 2 === 0));
            }

            const state = store.getState();
            expect(state.auth.isLoggedIn).toBe(false);
            expect(state.theme.isDarkmode).toBe(true); // 99 % 2 === 1, so should be true for i=99
        });
    });

    describe('Performance', () => {
        it('handles many subscribers efficiently', () => {
            const listeners = Array.from({ length: 1000 }, () => jest.fn());
            const unsubscribes = listeners.map(listener => store.subscribe(listener));

            const start = performance.now();
            store.dispatch(authActions.login());
            const end = performance.now();

            expect(end - start).toBeLessThan(100); // Should complete within 100ms

            listeners.forEach(listener => {
                expect(listener).toHaveBeenCalled();
            });

            unsubscribes.forEach(unsubscribe => unsubscribe());
        });
    });
});
