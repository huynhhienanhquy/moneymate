const MIN_SECRET_LENGTH = 32;

const knownInsecureSecrets = new Set([
  'super_secret_access_token_key_money_mate_2026',
  'super_secret_refresh_token_key_money_mate_2026',
  'replace-with-a-long-random-access-secret',
  'replace-with-a-long-random-refresh-secret',
]);

/**
 * Return required secret required by the env workflow.
 *
 * Use it while deriving the application's env settings.
 * @param name - The name value required by the operation.
 * @returns The resulting env value for the caller.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
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

/**
 * Return jwt access secret required by the env workflow.
 *
 * Use it while deriving the application's env settings.
 * @returns The resulting env value for the caller.
 */
export const getJwtAccessSecret = () => getRequiredSecret('JWT_ACCESS_SECRET');
/**
 * Return jwt refresh secret required by the env workflow.
 *
 * Use it while deriving the application's env settings.
 * @returns The resulting env value for the caller.
 */
export const getJwtRefreshSecret = () => getRequiredSecret('JWT_REFRESH_SECRET');

/**
 * Validate runtime environment before the env workflow continues.
 *
 * Use it while deriving the application's env settings.
 * @returns Nothing; the operation is complete when the function returns.
 */
export function validateRuntimeEnvironment() {
  getJwtAccessSecret();
  getJwtRefreshSecret();
}
