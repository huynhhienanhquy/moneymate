import { render, screen } from '@/test/render';
import MoneyMateCopilot from './MoneyMateCopilot';

const mocks = vi.hoisted(() => ({
  status: { mode: 'fallback', errorMessage: null } as {
    mode: 'copilot' | 'fallback' | 'waiting';
    errorMessage: string | null;
  },
}));

vi.mock('@/contexts/MoneyMateCopilotProvider', () => ({
  useMoneyMateCopilotStatus: () => mocks.status,
}));

vi.mock('@/components/AiChatWidget/AiChatWidget', () => ({
  default: () => <div>legacy chatbot</div>,
}));

vi.mock('./CopilotAiChatWidget', () => ({
  default: () => <div>CopilotKit chatbot</div>,
}));

describe('MoneyMateCopilot', () => {
  beforeEach(() => {
    mocks.status = { mode: 'fallback', errorMessage: null };
  });

  it('uses the legacy chatbot when the frontend flag is disabled', () => {
    render(<MoneyMateCopilot />);
    expect(screen.getByText('legacy chatbot')).toBeInTheDocument();
    expect(screen.queryByText('CopilotKit chatbot')).not.toBeInTheDocument();
  });

  it('renders the CopilotKit-powered chatbot and a safe error message', () => {
    mocks.status = {
      mode: 'copilot',
      errorMessage: 'Không thể kết nối MoneyMate AI. Vui lòng thử lại.',
    };
    render(<MoneyMateCopilot />);

    expect(screen.getByText('CopilotKit chatbot')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Không thể kết nối MoneyMate AI');
  });
});
