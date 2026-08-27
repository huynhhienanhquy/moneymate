import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import ProfilePage from './ProfilePage';

describe('ProfilePage', () => {
  it('renders profile details', () => {
    renderPage(ProfilePage);
    expect(screen.getByRole('heading', { name: 'Hồ sơ cá nhân' })).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('Money Mate').length).toBeGreaterThan(0);
    expect(screen.getAllByText('user@moneymate.vn').length).toBeGreaterThan(0);
  });

  it('keeps the profile shell visible while loading', () => {
    renderPage(ProfilePage, 'loading');
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
