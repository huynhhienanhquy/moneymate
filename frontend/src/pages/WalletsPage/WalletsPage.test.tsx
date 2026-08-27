import { fireEvent } from '@testing-library/react';
import { act } from 'react';
import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import WalletsPage from './WalletsPage';

describe('WalletsPage', () => {
  it('renders wallet balances and opens the create form', () => {
    renderPage(WalletsPage);
    expect(screen.getByText('Ví chính')).toBeInTheDocument();
    expect(screen.getAllByText('Ngân hàng').length).toBeGreaterThan(0);
    act(() => fireEvent.click(screen.getByRole('button', { name: /Thêm ví/ })));
    expect(screen.getByText('Thêm ví mới')).toBeInTheDocument();
  });

  it('renders an empty wallet state', () => {
    renderPage(WalletsPage, 'empty');
    expect(screen.getByText('Chưa có ví nào')).toBeInTheDocument();
  });
});
