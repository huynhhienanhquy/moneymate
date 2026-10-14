/**
 * Parse an integer while containing invalid numeric input at the utility boundary.
 *
 * Use it to keep shared utils behavior consistent across application layers.
 * @param value - The value to transform or evaluate.
 * @returns The resulting utils value for the caller.
 */
export function safeParseInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = parseInt(String(value), 10);
  return isNaN(num) ? undefined : num;
}
