import { fireEvent } from '@testing-library/react';
import { act } from 'react';
import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import SavingGoalsPage from './SavingGoalsPage';

describe('SavingGoalsPage', () => {
  it('renders saving goal progress', () => {
    renderPage(SavingGoalsPage);
    expect(screen.getByRole('heading', { name: 'Mục tiêu tiết kiệm' })).toBeInTheDocument();
    expect(screen.getAllByText('Du lịch').length).toBeGreaterThan(0);
  });

  it('opens the create goal form', () => {
    renderPage(SavingGoalsPage);
    act(() => fireEvent.click(screen.getByRole('button', { name: /Thêm mục tiêu mới/ })));
    expect(screen.getAllByText('Tạo mục tiêu tiết kiệm').length).toBeGreaterThan(0);
  });
});
