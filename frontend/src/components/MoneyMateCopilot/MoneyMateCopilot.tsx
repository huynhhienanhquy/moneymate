import AiChatWidget from '@/components/AiChatWidget/AiChatWidget';
import { useMoneyMateCopilotStatus } from '@/contexts/MoneyMateCopilotProvider';
import CopilotAiChatWidget from './CopilotAiChatWidget';

/**
 * Render the money mate copilot interface.
 *
 * Use it to keep the money mate copilot workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered money mate copilot interface.
 */
export const MoneyMateCopilot = () => {
  const { mode, errorMessage } = useMoneyMateCopilotStatus();

  if (mode === 'fallback') return <AiChatWidget />;
  if (mode === 'waiting') return null;

  return (
    <div className="moneymate-copilot">
      {errorMessage && (
        <div className="moneymate-copilot__error" role="alert">
          {errorMessage}
        </div>
      )}
      <CopilotAiChatWidget />
    </div>
  );
};

export default MoneyMateCopilot;
