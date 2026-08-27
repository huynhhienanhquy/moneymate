const requestUse = vi.fn();
const responseUse = vi.fn();
const retryRequest = vi.fn((config) => Promise.resolve({ config }));
const instance = Object.assign(retryRequest, {
  interceptors: { request: { use: requestUse }, response: { use: responseUse } },
});
const post = vi.fn();
const setToken = vi.fn();
const logout = vi.fn();
let accessToken: string | null = 'access-token';
let requestHandler: (config: any) => any;
let requestErrorHandler: (error: unknown) => Promise<never>;
let responseHandler: (response: unknown) => unknown;
let responseErrorHandler: (error: any) => Promise<unknown>;

vi.mock('axios', () => ({ default: { create: vi.fn(() => instance), post } }));
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: { getState: () => ({ accessToken, setToken, logout }) },
}));

describe('API client', () => {
  beforeAll(async () => {
    await import('../client');
    [requestHandler, requestErrorHandler] = requestUse.mock.calls[0];
    [responseHandler, responseErrorHandler] = responseUse.mock.calls[0];
  });

  beforeEach(() => {
    vi.clearAllMocks();
    accessToken = 'access-token';
  });

  it('attaches an access token and passes successful responses through', async () => {
    const api = (await import('../client')).default;
    expect(api).toBe(instance);
    const config = requestHandler({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer access-token');
    const response = { data: 'ok' };
    expect(responseHandler(response)).toBe(response);
  });

  it('covers requests without credentials and request failures', async () => {
    await import('../client');
    accessToken = null;
    expect(requestHandler({ headers: {} })).toEqual({ headers: {} });
    expect(requestHandler({})).toEqual({});
    await expect(requestErrorHandler(new Error('request failed'))).rejects.toThrow('request failed');
  });

  it.each(['/auth/refresh', '/auth/login'])('does not retry %s', async (url) => {
    await import('../client');
    const error = { config: { url, headers: {} }, response: { status: 401 } };
    await expect(responseErrorHandler(error)).rejects.toBe(error);
  });

  it('does not retry unrelated failures', async () => {
    await import('../client');
    const handle = responseErrorHandler;
    const forbidden = { config: { url: '/wallets', headers: {} }, response: { status: 403 } };
    const retried = { config: { url: '/wallets', headers: {}, _retry: true }, response: { status: 401 } };
    await expect(handle(forbidden)).rejects.toBe(forbidden);
    await expect(handle(retried)).rejects.toBe(retried);
  });

  it('refreshes the token and retries the request', async () => {
    await import('../client');
    post.mockResolvedValueOnce({ data: { data: { accessToken: 'fresh-token' } } });
    const config: any = { url: '/wallets', headers: {} };
    await expect(responseErrorHandler({ config, response: { status: 401 } })).resolves.toEqual({ config });
    expect(config._retry).toBe(true);
    expect(config.headers.Authorization).toBe('Bearer fresh-token');
    expect(setToken).toHaveBeenCalledWith('fresh-token');
  });

  it('queues concurrent failures behind one refresh', async () => {
    await import('../client');
    let finish!: (value: unknown) => void;
    post.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    const handle = responseErrorHandler;
    const first: any = { url: '/wallets', headers: {} };
    const second: any = { url: '/transactions', headers: {} };
    const firstRetry = handle({ config: first, response: { status: 401 } });
    const secondRetry = handle({ config: second, response: { status: 401 } });
    finish({ data: { data: { accessToken: 'queued-token' } } });
    await expect(Promise.all([firstRetry, secondRetry])).resolves.toHaveLength(2);
    expect(second.headers.Authorization).toBe('Bearer queued-token');
    expect(post).toHaveBeenCalledOnce();
  });

  it('rejects the queue and logs out when refresh fails', async () => {
    await import('../client');
    let fail!: (reason: unknown) => void;
    post.mockReturnValueOnce(new Promise((_, reject) => { fail = reject; }));
    const handle = responseErrorHandler;
    const failure = new Error('refresh failed');
    const first = handle({ config: { url: '/wallets', headers: {} }, response: { status: 401 } });
    const queued = handle({ config: { url: '/transactions', headers: {} }, response: { status: 401 } });
    fail(failure);
    await expect(first).rejects.toBe(failure);
    await expect(queued).rejects.toBe(failure);
    expect(logout).toHaveBeenCalledOnce();
  });
});
