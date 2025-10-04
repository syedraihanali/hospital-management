import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './AuthContext';

test('renders booking hero headline', () => {
  window.history.pushState({}, 'Home', '/Capstone-Project/');
  render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
  const headlineElement = screen.getByRole('heading', { name: /Book an appointment/i });
  expect(headlineElement).toBeInTheDocument();
});
