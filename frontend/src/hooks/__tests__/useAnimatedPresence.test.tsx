import { act } from 'react';
import { render, screen } from '@/test/render';
import { useAnimatedPresence } from '../useAnimatedPresence';

const Surface = ({ open }: { open: boolean }) => {
  const { isPresent, motionState } = useAnimatedPresence(open);
  return isPresent ? <div data-testid="surface" data-state={motionState}>Surface</div> : null;
};

describe('animated presence', () => {
  let reduced: boolean;
  let listeners: Set<() => void>;

  beforeEach(() => {
    vi.useFakeTimers();
    reduced = false;
    listeners = new Set();
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      get matches() { return reduced; },
      addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
    })));
  });

  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('keeps the exit visible briefly and cancels removal when reopened', () => {
    const { rerender } = render(<Surface open />);
    rerender(<Surface open={false} />);
    expect(screen.getByTestId('surface')).toHaveAttribute('data-state', 'closed');
    act(() => vi.advanceTimersByTime(100));
    rerender(<Surface open />);
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByTestId('surface')).toHaveAttribute('data-state', 'open');
    rerender(<Surface open={false} />);
    act(() => vi.advanceTimersByTime(180));
    expect(screen.queryByTestId('surface')).not.toBeInTheDocument();
  });

  it('closes immediately when reduced motion is enabled during an exit', () => {
    const { rerender } = render(<Surface open />);
    rerender(<Surface open={false} />);
    act(() => { reduced = true; listeners.forEach(listener => listener()); });
    expect(screen.queryByTestId('surface')).not.toBeInTheDocument();
    rerender(<Surface open />);
    rerender(<Surface open={false} />);
    expect(screen.queryByTestId('surface')).not.toBeInTheDocument();
  });
});
