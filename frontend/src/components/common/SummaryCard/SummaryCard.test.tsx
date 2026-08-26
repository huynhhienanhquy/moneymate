import { Wallet } from 'lucide-react';
import { render, screen } from '@/test/render';
import SummaryCard from './SummaryCard';

describe('SummaryCard', () => {
  it('renders its summary, badge and caption', () => {
    render(<SummaryCard icon={<Wallet data-testid="wallet-icon" />} label="Tổng thu" value="12.000.000 ₫" tone="green" badge="+12%" caption="So với tháng trước" />);
    expect(screen.getByText('Tổng thu')).toBeInTheDocument();
    expect(screen.getByText('12.000.000 ₫')).toHaveClass('text-emerald-600');
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('So với tháng trước')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-icon')).toBeInTheDocument();
  });
});
