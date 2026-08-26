import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/render';
import { getHookMocks } from '@/test/hookTestMocks';
import { useNotifications } from '../useNotifications';

const Harness = () => {
  const notifications = useNotifications();
  return <><span>{notifications.unreadCount}</span><button onClick={() => notifications.markRead('n1')}>read</button><button onClick={notifications.markAllRead}>all</button><button onClick={() => notifications.remove('n1')}>remove</button></>;
};

it('returns notification state and dispatches actions', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await act(async () => {
    await user.click(screen.getByRole('button', { name: 'read' }));
    await user.click(screen.getByRole('button', { name: 'all' }));
    await user.click(screen.getByRole('button', { name: 'remove' }));
  });
  expect(getHookMocks().mutate).toHaveBeenCalledTimes(3);
});
