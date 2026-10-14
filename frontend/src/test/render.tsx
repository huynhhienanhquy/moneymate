import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { screen } from '@testing-library/dom';

const mountedRoots = new Set<{ root: Root; container: HTMLDivElement }>();

/**
 * Render a React element into an isolated root managed by the test harness.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @param element - The element value required by the operation.
 * @returns The resulting render value for the caller.
 */
export const render = (element: ReactElement) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedRoots.add({ root, container });
  act(() => root.render(element));
  return { container, rerender: (nextElement: ReactElement) => act(() => root.render(nextElement)) };
};

/**
 * Cleanup for render.
 *
 * Use it from callers that need this operation without duplicating its rules.
 * @returns Nothing; the operation is complete when the function returns.
 */
export const cleanup = () => {
  mountedRoots.forEach(({ root, container }) => {
    act(() => root.unmount());
    container.remove();
  });
  mountedRoots.clear();
};

export { screen };
