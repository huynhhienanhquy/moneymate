import type { ComponentType } from 'react';
import { render, screen } from './render';

const arrayQueries = new Set(['admin-users', 'budgets', 'categories', 'monthly-trend', 'recurring', 'saving-goals', 'wallets']);

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector?: (state: unknown) => unknown) => {
    const state = { user: { id: 'user-1', fullName: 'Money Mate', email: 'user@moneymate.vn', role: 'USER' }, login: vi.fn(), setUser: vi.fn() };
    return selector ? selector(state) : state;
  },
}));
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: ({ queryKey }: { queryKey: unknown[] }) => ({ data: arrayQueries.has(String(queryKey[0])) ? [] : undefined, isLoading: false, isError: false }),
    useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});
vi.mock('recharts', () => {
  const Chart = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return { BarChart: Chart, Bar: Chart, XAxis: Chart, YAxis: Chart, CartesianGrid: Chart, Tooltip: Chart, ResponsiveContainer: Chart, LineChart: Chart, Line: Chart, LabelList: Chart, PieChart: Chart, Pie: Chart, Cell: Chart, Legend: Chart };
});

export const expectPageToRender = (Page: ComponentType, expectedText: string) => {
  render(<Page />);
  expect(screen.getAllByText(new RegExp(expectedText, 'i')).length).toBeGreaterThan(0);
};
