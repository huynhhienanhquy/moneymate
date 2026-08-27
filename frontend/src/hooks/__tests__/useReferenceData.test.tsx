import { render, screen } from '@/test/render';
import '@/test/hookTestMocks';
import { useCategories, useWallets } from '../useReferenceData';

const Harness = () => {
  const wallets = useWallets();
  const categories = useCategories();
  return <p>{wallets.data?.length}:{categories.data?.length}</p>;
};

it('creates wallet and category queries', () => {
  render(<Harness />);
  expect(screen.getByText('0:0')).toBeInTheDocument();
});
