import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';
import { store } from '../store';

// Test Header component in isolation
describe('Header Component', () => {
  it('renders BlogsApp title', () => {
    render(
      <MemoryRouter>
        <Provider store={store}>
          <Header />
        </Provider>
      </MemoryRouter>
    );
    
    const titleElement = screen.getByText('BlogsApp');
    expect(titleElement).toBeInTheDocument();
  });

  it('renders login button when not logged in', () => {
    render(
      <MemoryRouter>
        <Provider store={store}>
          <Header />
        </Provider>
      </MemoryRouter>
    );
    
    const loginButton = screen.getByText('Login');
    expect(loginButton).toBeInTheDocument();
  });
});
