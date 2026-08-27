import { render, screen } from '@/test/render';
import '@/test/routeTestMocks';
import AppRoutes from '../AppRoutes';

it('declares the application route tree', () => {
  render(<AppRoutes />);
  expect(screen.getByTestId('routes')).toBeInTheDocument();
});
