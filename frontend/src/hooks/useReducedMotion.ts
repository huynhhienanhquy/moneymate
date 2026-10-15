import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia?.(query);
  media?.addEventListener('change', onChange);
  return () => media?.removeEventListener('change', onChange);
};

/** Keep JavaScript animations in sync with the user's operating-system preference. */
export const useReducedMotion = () => useSyncExternalStore(
  subscribe,
  () => window.matchMedia?.(query).matches ?? false,
  () => true,
);
