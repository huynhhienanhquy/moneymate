import { formatChartValue, formatVND } from '../formatCurrency';

describe('formatCurrency', () => {
  it('formats Vietnamese currency', () => expect(formatVND(1234567)).toBe('1.234.567 đ'));
  it.each([[500, '500đ'], [1500, '1.5k'], [2_000_000, '2tr'], [-1_500_000, '-1.5tr']])('formats chart value %s', (value, expected) => {
    expect(formatChartValue(value as number)).toBe(expected);
  });
});
