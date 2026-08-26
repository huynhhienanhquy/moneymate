import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from './render';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

afterEach(() => cleanup());

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  configurable: true,
  value: () => undefined,
});
