import { fireEvent } from '@testing-library/react';
import { act } from 'react';
import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import RecurringPage from './RecurringPage';

describe('RecurringPage', () => {
  it('renders recurring transactions', () => {
    renderPage(RecurringPage);
    expect(screen.getByRole('heading', { name: 'Giao dịch định kỳ' })).toBeInTheDocument();
    expect(screen.getByText('Internet')).toBeInTheDocument();
  });

  it('renders empty state and opens the create form', () => {
    renderPage(RecurringPage, 'empty');
    expect(screen.getByText('Không tìm thấy giao dịch định kỳ')).toBeInTheDocument();
    act(() => fireEvent.click(screen.getAllByRole('button', { name: /Thêm định kỳ/ })[0]));
    expect(screen.getAllByText('Thêm giao dịch định kỳ').length).toBeGreaterThan(0);
  });
});
