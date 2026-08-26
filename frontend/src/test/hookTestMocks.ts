type HookMocks = { mutate: ReturnType<typeof vi.fn>; navigate: ReturnType<typeof vi.fn>; invalidateQueries: ReturnType<typeof vi.fn> };
const getMocks = () => {
  const scope = globalThis as typeof globalThis & { __moneyMateHookMocks?: HookMocks };
  scope.__moneyMateHookMocks ??= { mutate: vi.fn(), navigate: vi.fn(), invalidateQueries: vi.fn() };
  return scope.__moneyMateHookMocks;
};

export const getHookMocks = getMocks;

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => ({ data: queryKey[0] === 'notifications' ? { notifications: [], unreadCount: 0 } : [], isLoading: false }),
  useMutation: () => ({ mutate: getMocks().mutate, isPending: false }),
  useQueryClient: () => ({ invalidateQueries: getMocks().invalidateQueries }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => getMocks().navigate }));
vi.mock('@/stores/auth.store', () => ({ useAuthStore: (selector: (state: unknown) => unknown) => selector({ login: vi.fn() }) }));
vi.mock('@/services/api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
