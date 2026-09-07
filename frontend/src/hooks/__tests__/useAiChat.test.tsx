import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/render';
import { getHookMocks } from '@/test/hookTestMocks';
import { useAiChat } from '../useAiChat';

const Harness = () => {
  const chat = useAiChat();
  return <><input aria-label="chat" value={chat.input} onChange={(event) => chat.setInput(event.target.value)} /><button onClick={chat.send}>send</button><output aria-label="messages">{JSON.stringify(chat.messages)}</output></>;
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

it('assigns distinct persistent IDs to repeated messages without sending IDs to the API', async () => {
  vi.clearAllMocks();
  const user = userEvent.setup();
  render(<Harness />);
  await user.type(screen.getByLabelText('chat'), 'Xin chào');
  await user.click(screen.getByRole('button', { name: 'send' }));
  const firstMessages = JSON.parse(screen.getByLabelText('messages').textContent!);
  await user.type(screen.getByLabelText('chat'), 'Xin chào');
  await user.click(screen.getByRole('button', { name: 'send' }));
  const messages = JSON.parse(screen.getByLabelText('messages').textContent!);
  expect(messages).toHaveLength(4);
  expect(new Set(messages.map((message: { id: string }) => message.id)).size).toBe(4);
  expect(messages.slice(0, 2)).toEqual(firstMessages);
  expect(getHookMocks().post).toHaveBeenLastCalledWith('/ai/chat', {
    message: 'Xin chào', history: [{ role: 'user', content: 'Xin chào' }, { role: 'assistant', content: 'Phản hồi' }],
  });
});
