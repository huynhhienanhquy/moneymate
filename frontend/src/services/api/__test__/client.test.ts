const requestUse = vi.fn();
const responseUse = vi.fn();
const instance = Object.assign(vi.fn(), {
  interceptors: { request: { use: requestUse }, response: { use: responseUse } },
});

vi.mock('axios', () => ({
  default: { create: vi.fn(() => instance), post: vi.fn() },
}));
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'access-token', setToken: vi.fn(), logout: vi.fn() }) },
}));

describe('API client', () => {
  it('configures request and response interceptors', async () => {
    const api = (await import('../client')).default;
    expect(api).toBe(instance);
    expect(requestUse).toHaveBeenCalledOnce();
    expect(responseUse).toHaveBeenCalledOnce();

    const requestHandler = requestUse.mock.calls[0][0];
    const config = requestHandler({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer access-token');

    const responseHandler = responseUse.mock.calls[0][0];
    const response = { data: 'ok' };
    expect(responseHandler(response)).toBe(response);
  });
});
