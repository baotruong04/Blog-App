import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './store';

test('renders BlogsApp header', () => {
  render(
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>
  );
  const headerElement = screen.getByText(/BlogsApp/i);
  expect(headerElement).toBeInTheDocument();
});
