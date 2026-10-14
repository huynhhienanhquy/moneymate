/**
 * To local date input value for date input.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param date - The date or reporting period used by the operation.
 * @returns The resulting date input value for the caller.
 */
export function toLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
