const DECIMAL_MONEY = /^-?\d+(?:\.\d{1,2})?$/;

/**
 * Assert that money satisfies the domain workflow's requirements.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param value - The value to transform or evaluate.
 * @returns The resulting domain value for the caller.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
export function assertMoney(value: string): string {
  if (!DECIMAL_MONEY.test(value)) throw new Error('Invalid money value');
  return value;
}
