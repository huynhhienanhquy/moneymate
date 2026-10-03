import { fireEvent } from '@testing-library/react';
import { act } from 'react';
import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import CategoriesPage from './CategoriesPage';

describe('CategoriesPage', () => {
  it('renders income and expense categories', () => {
    renderPage(CategoriesPage);
    expect(screen.getByText('Ăn uống')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thu nhập/ })).toBeInTheDocument();
  });

  it('opens the category form', () => {
    renderPage(CategoriesPage);
    act(() => fireEvent.click(screen.getByRole('button', { name: /Thêm danh mục/ })));
    expect(screen.getByRole('heading', { name: 'Thêm danh mục' })).toBeInTheDocument();
  });
});
