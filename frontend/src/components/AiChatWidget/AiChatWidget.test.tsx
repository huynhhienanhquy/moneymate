import { act } from 'react';
import { fireEvent } from '@testing-library/dom';
import { render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import AiChatWidget from './AiChatWidget';
import type { ChatMessage } from '@/hooks/useAiChat';

const setOpen = vi.fn();
const setInput = vi.fn();
const send = vi.fn();
let hookState = {
  open: false,
  input: '',
  messages: [] as ChatMessage[],
  suggestions: [] as string[],
  isSending: false,
};

vi.mock('@/hooks/useAiChat', () => ({
  useAiChat: () => ({ ...hookState, setOpen, setInput, send, bottomRef: { current: null } }),
}));

describe('AiChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState = { open: false, input: '', messages: [], suggestions: [], isSending: false };
  });

  it('opens from the floating chat button', async () => {
    const user = userEvent.setup();
    render(<AiChatWidget />);
    await user.click(screen.getByTitle('MoneyMate AI Chat'));
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it('shows suggestions and copies one into the input', async () => {
    const user = userEvent.setup();
    hookState = { ...hookState, open: true, suggestions: ['Phân tích chi tiêu'] };
    render(<AiChatWidget />);
    expect(screen.getByText('Xin chào! Tôi có thể giúp bạn phân tích tài chính.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Phân tích chi tiêu' }));
    expect(setInput).toHaveBeenCalledWith('Phân tích chi tiêu');
  });

  it('renders messages and sends from Enter', async () => {
    const user = userEvent.setup();
    hookState = { ...hookState, open: true, input: 'Tư vấn', messages: [{ id: 'reply-1', role: 'assistant', content: 'Bạn đang chi tiêu ổn.' }] };
    render(<AiChatWidget />);
    expect(screen.getByText('Bạn đang chi tiêu ổn.')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Hỏi về tài chính của bạn...'), '{Enter}');
    expect(send).toHaveBeenCalledOnce();
  });

  it('returns focus and disables the closing panel until its exit finishes', () => {
    vi.useFakeTimers();
    try {
      hookState.open = true;
      const { rerender } = render(<AiChatWidget />);
      const input = screen.getByPlaceholderText('Hỏi về tài chính của bạn...');
      input.focus();
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(setOpen).toHaveBeenCalledWith(false);
      expect(screen.getByRole('button', { name: 'Mở trò chuyện MoneyMate AI' })).toHaveFocus();

      hookState.open = false;
      rerender(<AiChatWidget />);
      const panel = document.getElementById('ai-chat-panel');
      expect(panel).toHaveAttribute('data-state', 'closed');
      expect(panel).toHaveAttribute('aria-hidden', 'true');
      expect(panel).toHaveAttribute('inert');
      act(() => vi.advanceTimersByTime(180));
      expect(document.getElementById('ai-chat-panel')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('preserves message identity when identical messages are reordered or removed', () => {
    const first: ChatMessage = { id: 'reply-1', role: 'assistant', content: 'Cùng nội dung' };
    const second: ChatMessage = { id: 'reply-2', role: 'assistant', content: 'Cùng nội dung' };
    hookState = { ...hookState, open: true, messages: [first, second] };
    const { rerender } = render(<AiChatWidget />);
    const [firstNode, secondNode] = screen.getAllByText('Cùng nội dung');

    hookState.messages = [second, first];
    rerender(<AiChatWidget />);
    expect(screen.getAllByText('Cùng nội dung')[0]).toBe(secondNode);
    expect(screen.getAllByText('Cùng nội dung')[1]).toBe(firstNode);
    hookState.messages = [second];
    rerender(<AiChatWidget />);
    expect(screen.getByText('Cùng nội dung')).toBe(secondNode);
  });
});
