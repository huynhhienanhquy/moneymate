import jwt from 'jsonwebtoken';
import { resolveCopilotUser } from '../../copilotkit/auth';
import { getBearerToken, verifyAccessToken } from '../../middlewares/auth';

describe('CopilotKit authentication', () => {
  const originalEnvironment = { ...process.env };

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'copilotkit-test-access-secret';
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it('extracts only a well-formed bearer token', () => {
    expect(getBearerToken('Bearer access-token')).toBe('access-token');
    expect(getBearerToken('bearer access-token')).toBe('access-token');
    expect(getBearerToken('Basic access-token')).toBeNull();
    expect(getBearerToken('Bearer')).toBeNull();
  });

  it('resolves the authenticated identity from a signed JWT', async () => {
    const token = jwt.sign(
      { userId: 'user-123', email: 'user@example.com', role: 'USER' },
      process.env.JWT_ACCESS_SECRET!,
      { algorithm: 'HS256', expiresIn: '15m' },
    );

    await expect(verifyAccessToken(token)).resolves.toEqual({
      id: 'user-123',
      email: 'user@example.com',
      role: 'USER',
    });
  });

  it('rejects a token without the required identity claims', async () => {
    const token = jwt.sign(
      { subject: 'user-123' },
      process.env.JWT_ACCESS_SECRET!,
      { algorithm: 'HS256', expiresIn: '15m' },
    );

    await expect(verifyAccessToken(token)).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  });

  it.each([
    ['invalid signature', () => jwt.sign(
      { userId: 'user-123', email: 'user@example.com' },
      'a-different-signing-secret',
      { algorithm: 'HS256', expiresIn: '15m' },
    )],
    ['expired token', () => jwt.sign(
      { userId: 'user-123', email: 'user@example.com' },
      process.env.JWT_ACCESS_SECRET!,
      { algorithm: 'HS256', expiresIn: -1 },
    )],
  ])('rejects an %s', async (_caseName, createToken) => {
    await expect(verifyAccessToken(createToken())).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHORIZED',
    });
  });

  it('returns a consumer-safe response when the runtime request has no token', async () => {
    const request = new Request('http://localhost/api/copilotkit', {
      method: 'POST',
      headers: { 'x-request-id': 'request-123' },
    });

    try {
      await resolveCopilotUser(request);
      throw new Error('Expected resolveCopilotUser to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual(expect.objectContaining({
        success: false,
        code: 'UNAUTHORIZED',
        requestId: 'request-123',
      }));
    }
  });
});
