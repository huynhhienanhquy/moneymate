import { useThemeStore } from '../theme.store';

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    useThemeStore.setState({ theme: 'dark' });
  });

  it('initializes and toggles the persisted theme', () => {
    localStorage.setItem('mm_theme', 'light');
    useThemeStore.getState().initTheme();
    expect(useThemeStore.getState().theme).toBe('light');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('defaults to dark when no theme has been persisted', () => {
    useThemeStore.getState().initTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement).toHaveClass('dark');
  });
});
