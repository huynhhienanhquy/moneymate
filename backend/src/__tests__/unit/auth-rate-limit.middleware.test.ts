import { AuthRateLimiter, createAuthRateLimitMiddleware } from '../../middlewares/auth-rate-limit';

describe('auth rate limiting', () => {
  it('blocks attempts after the configured fixed-window limit', () => {
    const limiter = new AuthRateLimiter(2, 1_000);
    expect(limiter.consume('client', 0).allowed).toBe(true);
    expect(limiter.consume('client', 1).allowed).toBe(true);
    expect(limiter.consume('client', 2).allowed).toBe(false);
    expect(limiter.consume('client', 1_001).allowed).toBe(true);
  });

  it('returns a structured 429 response for excessive login attempts', () => {
    process.env.AUTH_LOGIN_RATE_LIMIT_MAX = '1';
    const middleware = createAuthRateLimitMiddleware('login');
    const request = { ip: '127.0.0.1', socket: {} } as any;
    const response = {
      locals: { requestId: 'request-1' },
      setHeader: jest.fn(),
      status: jest.fn(),
      json: jest.fn(),
    } as any;
    response.status.mockReturnValue(response);

    middleware(request, response, jest.fn());
    middleware(request, response, jest.fn());

    expect(response.status).toHaveBeenLastCalledWith(429);
    expect(response.json).toHaveBeenLastCalledWith(expect.objectContaining({
      code: 'AUTH_RATE_LIMITED',
      requestId: 'request-1',
    }));
    delete process.env.AUTH_LOGIN_RATE_LIMIT_MAX;
  });
});
