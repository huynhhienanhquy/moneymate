import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/render';
import CopilotAiChatWidget from './CopilotAiChatWidget';

const mocks = vi.hoisted(() => ({
  chatProps: [] as Array<Record<string, unknown>>,
  mounts: vi.fn(),
}));

vi.mock('@copilotkit/react-core/v2', async () => {
  const { useState, useEffect } = await vi.importActual<typeof import('react')>('react');
  return {
  CopilotChat: (props: Record<string, unknown>) => {
    const [input, setInput] = useState('');
    const [pending, setPending] = useState(false);
    useEffect(() => { mocks.mounts(); }, []);
    mocks.chatProps.push(props);
    return <div data-testid="copilot-chat"><input aria-label="Tin nhắn" value={input} onChange={event => setInput(event.target.value)} /><button onClick={() => setPending(true)}>Chuẩn bị giao dịch</button>{pending && <p>Đang chờ xác nhận giao dịch</p>}</div>;
  },
  };
});

describe('CopilotAiChatWidget', () => {
  beforeEach(() => {
    mocks.chatProps.length = 0;
    mocks.mounts.mockClear();
  });

  it('opens the MoneyMate dialog with an embedded localized CopilotKit chat', async () => {
    const user = userEvent.setup();
    render(<CopilotAiChatWidget />);

    expect(screen.queryByRole('dialog', { name: 'Trợ lý MoneyMate' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mở trợ lý MoneyMate' }));

    expect(screen.getByRole('dialog', { name: 'Trợ lý MoneyMate' })).toBeInTheDocument();
    expect(screen.getByText('Trợ lý tài chính cá nhân')).toBeInTheDocument();
    expect(screen.getByTestId('copilot-chat')).toBeInTheDocument();
    expect(mocks.chatProps[0].agentId).toBe('default');
    const labels = mocks.chatProps[0].labels as Record<string, string>;
    expect(labels.welcomeMessageText).toContain('tài chính cá nhân');
    expect(labels.welcomeMessageText).toContain('mở trang báo cáo');
    expect(labels.welcomeMessageText).toContain('bật chế độ tối');
    expect(labels.chatInputPlaceholder).toContain('Hỏi MoneyMate');
    expect(labels.chatDisclaimerText).toContain('không phải tư vấn tài chính');
  });

  it('closes from the dialog header', async () => {
    const user = userEvent.setup();
    render(<CopilotAiChatWidget />);

    await user.click(screen.getByRole('button', { name: 'Mở trợ lý MoneyMate' }));
    await user.click(screen.getByRole('button', { name: 'Đóng trợ lý MoneyMate' }));

    expect(screen.queryByRole('dialog', { name: 'Trợ lý MoneyMate' })).not.toBeInTheDocument();
  });

  it('keeps the same chat, thread, input and pending confirmation when closed and reopened', async () => {
    const user = userEvent.setup();
    render(<CopilotAiChatWidget />);
    expect(mocks.mounts).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Mở trợ lý MoneyMate' }));
    const threadId = mocks.chatProps[0].threadId;
    await user.type(screen.getByLabelText('Tin nhắn'), 'Sửa khoản chi ăn trưa');
    await user.click(screen.getByRole('button', { name: 'Chuẩn bị giao dịch' }));
    await user.click(screen.getByRole('button', { name: 'Đóng trợ lý MoneyMate' }));
    expect(screen.getByTestId('copilot-chat')).not.toBeVisible();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mở trợ lý MoneyMate' }));
    expect(screen.getByLabelText('Tin nhắn')).toHaveValue('Sửa khoản chi ăn trưa');
    expect(screen.getByText('Đang chờ xác nhận giao dịch')).toBeVisible();
    expect(mocks.mounts).toHaveBeenCalledTimes(1);
    expect(mocks.chatProps[mocks.chatProps.length - 1]?.threadId).toBe(threadId);
  });
});
