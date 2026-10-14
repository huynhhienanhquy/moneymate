import type { Mock } from 'vitest';

type MockFn = Mock<(...args: any[]) => any>;
type HookMocks = { mutate: MockFn; navigate: MockFn; invalidateQueries: MockFn; login: MockFn; get: MockFn; post: MockFn; patch: MockFn; delete: MockFn };
/**
 * Return mocks required by the hook test mocks workflow.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @returns The resulting hook test mocks value for the caller.
 */
const getMocks = () => {
  const scope = globalThis as typeof globalThis & { __moneyMateHookMocks?: HookMocks };
  scope.__moneyMateHookMocks ??= {
    mutate: vi.fn(), navigate: vi.fn(), invalidateQueries: vi.fn(), login: vi.fn(),
    get: vi.fn().mockResolvedValue({ data: { data: { notifications: [], unreadCount: 0 } } }),
    post: vi.fn().mockResolvedValue({ data: { data: { user: { id: 'u1' }, accessToken: 'token' } } }),
    patch: vi.fn().mockResolvedValue({}), delete: vi.fn().mockResolvedValue({}),
  };
  return scope.__moneyMateHookMocks;
};

export const getHookMocks = getMocks;

vi.mock('@tanstack/react-query', () => ({
  /**
   * Provide query state and actions to React consumers.
   *
   * Use it in React components that need this shared behavior.
   * @param props - The properties that configure this React component.
   * @returns The current query state and the actions that operate on it.
   */
  useQuery: ({ queryKey, queryFn }: { queryKey: unknown[]; queryFn?: () => unknown }) => { void queryFn?.(); return { data: queryKey[0] === 'notifications' ? { notifications: [], unreadCount: 0 } : [], isLoading: false }; },
  /**
   * Provide mutation state and actions to React consumers.
   *
   * Use it in React components that need this shared behavior.
   * @param options - Settings that customize how the operation runs.
   * @returns The current mutation state and the actions that operate on it.
   */
  useMutation: (options: { mutationFn?: (value?: any) => unknown; onSuccess?: (data?: any) => void }) => ({
    /**
     * Mutate for hook test mocks.
     *
     * Use it from callers that need this operation without duplicating its rules.
     * @param value - The value to transform or evaluate.
     * @returns Nothing; the operation is complete when the function returns.
     */
    mutate: (value?: any) => { getMocks().mutate(value); void options.mutationFn?.(value); options.onSuccess?.({ reply: 'Phản hồi', suggestions: ['Gợi ý'] }); },
    isPending: false,
  }),
  /**
   * Provide query client state and actions to React consumers.
   *
   * Use it in React components that need this shared behavior.
   * @returns The current query client state and the actions that operate on it.
   */
  useQueryClient: () => ({ invalidateQueries: getMocks().invalidateQueries }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => getMocks().navigate }));
vi.mock('@/stores/auth.store', () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ login: getMocks().login }) }));
vi.mock('@/services/api/client', () => ({ runAuthSessionTransition: (operation: () => Promise<unknown>) => operation(), default: { get: (...args: any[]) => getMocks().get(...args), post: (...args: any[]) => getMocks().post(...args), patch: (...args: any[]) => getMocks().patch(...args), delete: (...args: any[]) => getMocks().delete(...args) } }));
