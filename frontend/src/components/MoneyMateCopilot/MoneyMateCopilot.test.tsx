import { render, screen } from '@/test/render';
import MoneyMateCopilot from './MoneyMateCopilot';

const mocks = vi.hoisted(() => ({
  status: { mode: 'fallback', errorMessage: null } as {
    mode: 'copilot' | 'fallback' | 'waiting';
    errorMessage: string | null;
  },
  popupProps: [] as Array<Record<string, unknown>>,
}));

vi.mock('@copilotkit/react-core/v2', () => ({
  CopilotPopup: (props: Record<string, unknown>) => {
    mocks.popupProps.push(props);
    return <div data-testid="copilot-popup" />;
  },
}));

vi.mock('@/contexts/MoneyMateCopilotProvider', () => ({
  useMoneyMateCopilotStatus: () => mocks.status,
}));

vi.mock('@/components/AiChatWidget/AiChatWidget', () => ({
  default: () => <div>legacy chatbot</div>,
}));

describe('MoneyMateCopilot', () => {
  beforeEach(() => {
    mocks.status = { mode: 'fallback', errorMessage: null };
    mocks.popupProps.length = 0;
  });

  it('uses the legacy chatbot when the frontend flag is disabled', () => {
    render(<MoneyMateCopilot />);
    expect(screen.getByText('legacy chatbot')).toBeInTheDocument();
    expect(screen.queryByTestId('copilot-popup')).not.toBeInTheDocument();
  });

  it('renders the localized popup and a safe error message', () => {
    mocks.status = {
      mode: 'copilot',
      errorMessage: 'Không thể kết nối MoneyMate AI. Vui lòng thử lại.',
    };
    render(<MoneyMateCopilot />);

    expect(screen.getByTestId('copilot-popup')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Không thể kết nối MoneyMate AI');
    const labels = mocks.popupProps[0].labels as Record<string, string>;
    expect(labels.modalHeaderTitle).toBe('Trợ lý MoneyMate');
    expect(labels.welcomeMessageText).toContain('tài chính cá nhân');
    expect(labels.chatInputPlaceholder).toContain('Hỏi MoneyMate');
    expect(labels.chatDisclaimerText).toContain('không phải tư vấn tài chính');
    expect(mocks.popupProps[0].agentId).toBe('default');
    expect(mocks.popupProps[0].defaultOpen).toBe(false);
  });
});
