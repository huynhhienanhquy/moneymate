export function safeParseInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = parseInt(String(value), 10);
  return isNaN(num) ? undefined : num;
}
