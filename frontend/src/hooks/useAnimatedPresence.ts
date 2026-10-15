import { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/** Keep a closing surface mounted only until its CSS exit animation finishes. */
export const useAnimatedPresence = (open: boolean, exitDuration = 180) => {
  const [retained, setRetained] = useState(open);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (open) {
      setRetained(true);
      return;
    }
    if (reducedMotion) {
      setRetained(false);
      return;
    }
    if (!retained) return;
    const timeout = window.setTimeout(() => setRetained(false), exitDuration);
    return () => window.clearTimeout(timeout);
  }, [open, retained, exitDuration, reducedMotion]);

  return { isPresent: open || retained, motionState: open ? 'open' : 'closed' } as const;
};
