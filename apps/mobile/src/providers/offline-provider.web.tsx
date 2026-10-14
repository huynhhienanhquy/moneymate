import type { PropsWithChildren } from 'react';

/**
 * Provide offline provider.web state and services to descendant components.
 *
 * Use it near the application root so descendants share the same offline provider.web lifecycle.
 * @param props - The properties that configure this React component.
 * @returns The rendered offline provider interface.
 */
export function OfflineProvider({ children }: PropsWithChildren) {
  return children;
}
