import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/render';
import { getHookMocks } from '@/test/hookTestMocks';
import { useAiChat } from '../useAiChat';

const Harness = () => {
  const chat = useAiChat();
  return <><input aria-label="chat" value={chat.input} onChange={(event) => chat.setInput(event.target.value)} /><button onClick={chat.send}>send</button></>;
};

it('sends a non-empty message', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await act(async () => {
    await user.type(screen.getByLabelText('chat'), 'Xin chào');
    await user.click(screen.getByRole('button', { name: 'send' }));
  });
  expect(getHookMocks().mutate).toHaveBeenCalledWith({ message: 'Xin chào', history: [] });
});
