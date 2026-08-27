import { act } from 'react';
import { fireEvent } from '@testing-library/react';
import { render, screen } from '@/test/render';
import { getHookMocks } from '@/test/hookTestMocks';
import { useNotifications } from '../useNotifications';

const Harness = () => {
  const notifications = useNotifications();
  // The harness intentionally exposes every hook result, including its DOM ref.
  // eslint-disable-next-line react-hooks/refs
  return <><span>{notifications.unreadCount}</span><span>{notifications.open ? 'open' : 'closed'}</span><div ref={notifications.containerRef}>inside</div><button onClick={() => notifications.setOpen(true)}>open</button><button onClick={() => notifications.markRead('n1')}>read</button><button onClick={() => notifications.markAllRead()}>all</button><button onClick={() => notifications.remove('n1')}>remove</button></>;
};

it('returns notification state and dispatches actions', async () => {
  render(<Harness />);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'open' }));
    fireEvent.mouseDown(screen.getByText('inside'));
    fireEvent.mouseDown(document.body);
    fireEvent.click(screen.getByRole('button', { name: 'read' }));
    fireEvent.click(screen.getByRole('button', { name: 'all' }));
    fireEvent.click(screen.getByRole('button', { name: 'remove' }));
  });
  expect(getHookMocks().mutate).toHaveBeenCalledTimes(3);
  expect(screen.getByText('closed')).toBeInTheDocument();
});
