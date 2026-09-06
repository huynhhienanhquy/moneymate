import '@copilotkit/react-core/v2/styles.css';
import '@/styles/copilotkit.css';
import { PageLayoutContent } from '@/layouts/PageLayout/PageLayout';
import MoneyMateCopilot from './MoneyMateCopilot';
import MoneyMateCopilotProvider from '@/contexts/MoneyMateCopilotProvider';

export const MoneyMateCopilotFeature = () => (
  <MoneyMateCopilotProvider>
    <PageLayoutContent assistant={<MoneyMateCopilot />} />
  </MoneyMateCopilotProvider>
);

export default MoneyMateCopilotFeature;
