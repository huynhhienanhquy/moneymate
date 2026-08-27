import { render, screen } from '@/test/render';
import userEvent from '@testing-library/user-event';
import AiChatWidget from './AiChatWidget';

const setOpen = vi.fn();
const setInput = vi.fn();
const send = vi.fn();
let hookState = {
  open: false,
  input: '',
  messages: [] as Array<{ role: 'user' | 'assistant'; content: string }>,
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
    hookState = { ...hookState, open: true, input: 'Tư vấn', messages: [{ role: 'assistant', content: 'Bạn đang chi tiêu ổn.' }] };
    render(<AiChatWidget />);
    expect(screen.getByText('Bạn đang chi tiêu ổn.')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Hỏi về tài chính của bạn...'), '{Enter}');
    expect(send).toHaveBeenCalledOnce();
  });
});
