import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from './render';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

afterEach(() => cleanup());

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  configurable: true,
  /**
   * Return a deterministic media-query match for the current test environment.
   *
   * Use it from callers that need this operation without duplicating its rules.
   * @returns The resulting setup value for the caller.
   */
  value: () => undefined,
});
