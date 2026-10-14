import '@copilotkit/react-core/v2/styles.css';
import '@/styles/copilotkit.css';
import { PageLayoutContent } from '@/layouts/PageLayout/PageLayout';
import MoneyMateCopilot from './MoneyMateCopilot';
import MoneyMateCopilotProvider from '@/contexts/MoneyMateCopilotProvider';

/**
 * Render the money mate copilot feature interface.
 *
 * Use it to keep the money mate copilot feature workflow's presentation and interactions in one reusable UI boundary.
 * @returns The rendered money mate copilot feature interface.
 */
export const MoneyMateCopilotFeature = () => (
  <MoneyMateCopilotProvider>
    <PageLayoutContent assistant={<MoneyMateCopilot />} />
  </MoneyMateCopilotProvider>
);

export default MoneyMateCopilotFeature;
