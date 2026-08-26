import { render, screen } from '@/test/render';
import { AiInsightCard } from './AiInsightCard';

describe('AiInsightCard', () => {
  it('renders the supplied insight', () => {
    render(<AiInsightCard type="positive" title="Tiết kiệm tốt" message="Bạn đã đạt mục tiêu." />);

    expect(screen.getByText('Tiết kiệm tốt')).toBeInTheDocument();
    expect(screen.getByText('Bạn đã đạt mục tiêu.')).toBeInTheDocument();
  });
});
