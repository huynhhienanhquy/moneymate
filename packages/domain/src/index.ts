const DECIMAL_MONEY = /^-?\d+(?:\.\d{1,2})?$/;

export function assertMoney(value: string): string {
  if (!DECIMAL_MONEY.test(value)) throw new Error('Invalid money value');
  return value;
}
