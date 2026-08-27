type HookMocks = { mutate: ReturnType<typeof vi.fn>; navigate: ReturnType<typeof vi.fn>; invalidateQueries: ReturnType<typeof vi.fn>; login: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
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
  useQuery: ({ queryKey, queryFn }: { queryKey: unknown[]; queryFn?: () => unknown }) => { void queryFn?.(); return { data: queryKey[0] === 'notifications' ? { notifications: [], unreadCount: 0 } : [], isLoading: false }; },
  useMutation: (options: { mutationFn?: (value?: any) => unknown; onSuccess?: (data?: any) => void }) => ({
    mutate: (value?: any) => { getMocks().mutate(value); void options.mutationFn?.(value); options.onSuccess?.({ reply: 'Phản hồi', suggestions: ['Gợi ý'] }); },
    isPending: false,
  }),
  useQueryClient: () => ({ invalidateQueries: getMocks().invalidateQueries }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => getMocks().navigate }));
vi.mock('@/stores/auth.store', () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ login: getMocks().login }) }));
vi.mock('@/services/api/client', () => ({ default: { get: (...args: any[]) => getMocks().get(...args), post: (...args: any[]) => getMocks().post(...args), patch: (...args: any[]) => getMocks().patch(...args), delete: (...args: any[]) => getMocks().delete(...args) } }));
