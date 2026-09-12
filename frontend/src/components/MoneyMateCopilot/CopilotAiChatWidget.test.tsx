import userEvent from '@testing-library/user-event';
import { render, screen } from '@/test/render';
import CopilotAiChatWidget from './CopilotAiChatWidget';

const mocks = vi.hoisted(() => ({
  chatProps: [] as Array<Record<string, unknown>>,
}));

vi.mock('@copilotkit/react-core/v2', () => ({
  CopilotChat: (props: Record<string, unknown>) => {
    mocks.chatProps.push(props);
    return <div data-testid="copilot-chat" />;
  },
}));

describe('CopilotAiChatWidget', () => {
  beforeEach(() => {
    mocks.chatProps.length = 0;
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
});
