const MIN_SECRET_LENGTH = 32;

const knownInsecureSecrets = new Set([
  'super_secret_access_token_key_money_mate_2026',
  'super_secret_refresh_token_key_money_mate_2026',
  'replace-with-a-long-random-access-secret',
  'replace-with-a-long-random-refresh-secret',
]);

function getRequiredSecret(name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required; refusing to start with an unsigned or predictable token configuration`);
  }
  if (
    process.env.NODE_ENV === 'production' &&
    (value.length < MIN_SECRET_LENGTH || knownInsecureSecrets.has(value))
  ) {
    throw new Error(`${name} must be at least ${MIN_SECRET_LENGTH} characters and must not use an example value`);
  }
  return value;
}

export const getJwtAccessSecret = () => getRequiredSecret('JWT_ACCESS_SECRET');
export const getJwtRefreshSecret = () => getRequiredSecret('JWT_REFRESH_SECRET');

export function validateRuntimeEnvironment() {
  getJwtAccessSecret();
  getJwtRefreshSecret();
}
