import { render, screen } from '@/test/render';
import AppCard from './AppCard';

it('renders the configured semantic element and variants', () => {
  render(<AppCard as="article" interactive padding="lg">Nội dung thẻ</AppCard>);
  expect(screen.getByRole('article')).toHaveClass('app-card', 'app-card-hover', 'p-6');
});
