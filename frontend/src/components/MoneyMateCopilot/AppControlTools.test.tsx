import { act } from 'react';
import { render } from '@/test/render';
import { APP_ROUTES } from '@/constants/routes';
import { AppControlTools } from './AppControlTools';

const mocks = vi.hoisted(() => ({
  tools: [] as Array<Record<string, unknown>>,
  navigate: vi.fn(),
  setTheme: vi.fn(),
}));

vi.mock('@copilotkit/react-core/v2', () => ({
  useFrontendTool: (tool: Record<string, unknown>) => {
    mocks.tools.push(tool);
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/stores/theme.store', () => ({
  useThemeStore: (selector: (state: { setTheme: typeof mocks.setTheme }) => unknown) =>
    selector({ setTheme: mocks.setTheme }),
}));

describe('AppControlTools', () => {
  beforeEach(() => {
    mocks.tools.length = 0;
    mocks.navigate.mockReset();
    mocks.setTheme.mockReset();
  });

  it('registers theme and navigation controls for the default agent', () => {
    render(<AppControlTools />);

    expect(mocks.tools.map((tool) => tool.name)).toEqual(['setAppTheme', 'navigateToPage']);
    expect(mocks.tools.every((tool) => tool.agentId === 'default')).toBe(true);
    expect(mocks.tools.every((tool) => tool.followUp === false)).toBe(true);
  });

  it('applies the exact theme requested by the copilot', async () => {
    render(<AppControlTools />);
    const themeTool = mocks.tools.find((tool) => tool.name === 'setAppTheme')!;

    let result: unknown;
    await act(async () => {
      result = await (themeTool.handler as (args: { theme: 'dark' | 'light' }) => Promise<unknown>)({ theme: 'dark' });
    });

    expect(mocks.setTheme).toHaveBeenCalledWith('dark');
    expect(result).toBe('Đã chuyển MoneyMate sang chế độ tối.');
  });

  it('opens the requested app page through the router', async () => {
    render(<AppControlTools />);
    const navigationTool = mocks.tools.find((tool) => tool.name === 'navigateToPage')!;

    let result: unknown;
    await act(async () => {
      result = await (navigationTool.handler as (args: { page: 'reports' }) => Promise<unknown>)({ page: 'reports' });
    });

    expect(mocks.navigate).toHaveBeenCalledWith(APP_ROUTES.reports);
    expect(result).toBe('Đã mở trang Báo cáo.');
  });
});
