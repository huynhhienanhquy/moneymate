import { getJwtAccessSecret, validateRuntimeEnvironment } from '../../config/env';

describe('runtime environment validation', () => {
  const originalEnvironment = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it('refuses to use a missing access-token secret', () => {
    delete process.env.JWT_ACCESS_SECRET;
    expect(() => getJwtAccessSecret()).toThrow('JWT_ACCESS_SECRET is required');
  });

  it('rejects known example secrets in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'super_secret_access_token_key_money_mate_2026';
    expect(() => getJwtAccessSecret()).toThrow('must be at least 32 characters and must not use an example value');
  });

  it('accepts independent strong access and refresh secrets', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'access-0123456789abcdef-0123456789abcdef';
    process.env.JWT_REFRESH_SECRET = 'refresh-0123456789abcdef-0123456789abcdef';
    expect(() => validateRuntimeEnvironment()).not.toThrow();
  });
});
