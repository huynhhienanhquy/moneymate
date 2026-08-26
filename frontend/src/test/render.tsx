import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { screen } from '@testing-library/dom';

const mountedRoots = new Set<{ root: Root; container: HTMLDivElement }>();

export const render = (element: ReactElement) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mountedRoots.add({ root, container });
  act(() => root.render(element));
  return { container };
};

export const cleanup = () => {
  mountedRoots.forEach(({ root, container }) => {
    act(() => root.unmount());
    container.remove();
  });
  mountedRoots.clear();
};

export { screen };
