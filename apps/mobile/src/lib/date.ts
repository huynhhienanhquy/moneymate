const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * To local date input value for date.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param date - The date or reporting period used by the operation.
 * @returns The resulting date value for the caller.
 */
export function toLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * To transaction timestamp for date.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param value - The value to transform or evaluate.
 * @param now - The reference time used to make the calculation deterministic.
 * @returns The resulting date value for the caller.
 * @throws {Error} When validation fails or a required dependency cannot complete the operation.
 */
export function toTransactionTimestamp(value: string, now = new Date()) {
  const match = DATE_INPUT_PATTERN.exec(value);
  if (!match) throw new Error('Ngày giao dịch phải có định dạng YYYY-MM-DD');

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const localNoon = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    localNoon.getFullYear() !== year ||
    localNoon.getMonth() !== month - 1 ||
    localNoon.getDate() !== day
  ) {
    throw new Error('Ngày giao dịch không hợp lệ');
  }

  const today = toLocalDateInputValue(now);
  if (value > today) throw new Error('Ngày giao dịch không được ở tương lai');

  // A noon timestamp can still be in the future when the transaction is added
  // earlier on the same day. Use the actual current time for today's entries.
  return value === today ? now.toISOString() : localNoon.toISOString();
}
