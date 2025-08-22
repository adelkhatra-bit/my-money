import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

test('render Dashboard title', () => {
  render(<Dashboard />);
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
