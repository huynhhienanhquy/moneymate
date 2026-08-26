import { render, screen } from '@/test/render';
import AppFooter from './AppFooter';

it('renders brand, navigation links and copyright', () => {
  render(<AppFooter links={[{ label: 'Bảo mật', href: '#privacy' }]} copyright="© MoneyMate" />);
  expect(screen.getByText('MoneyMate')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Bảo mật' })).toHaveAttribute('href', '#privacy');
  expect(screen.getByText('© MoneyMate')).toBeInTheDocument();
});
