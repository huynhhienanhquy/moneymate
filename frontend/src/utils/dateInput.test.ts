import { toLocalDateInputValue } from './dateInput';

describe('toLocalDateInputValue', () => {
  it('uses local calendar fields instead of the UTC date', () => {
    const instant = new Date(2026, 8, 4, 0, 30);
    expect(toLocalDateInputValue(instant)).toBe('2026-09-04');
  });
});
