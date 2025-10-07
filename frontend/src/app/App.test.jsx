import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from '../features/auth/context/AuthContext';

test('renders booking hero call-to-action', () => {
  window.history.pushState({}, 'Home', '/Capstone-Project/');
  render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
  const ctaLinks = screen.getAllByRole('link', { name: /Book an appointment/i });
  expect(ctaLinks.length).toBeGreaterThan(0);
});
