import { BuiltInAgent, type BuiltInAgentClassicConfig } from '@copilotkit/runtime/v2';
import { CopilotKitConfig } from '../config/copilotkit';
import { AuthenticatedUser } from '../middlewares/auth';
import { buildFinancialTools } from './financial-tools';
import { MONEY_MATE_COPILOT_PROMPT } from './prompt';

export interface MoneyMateAgentContext {
  requestId?: string;
}

class TimedBuiltInAgent extends BuiltInAgent {
  constructor(
    private readonly agentConfig: BuiltInAgentClassicConfig,
    private readonly timeoutMs: number,
  ) {
    super(agentConfig);
  }

  override clone(): BuiltInAgent {
    return new TimedBuiltInAgent(this.agentConfig, this.timeoutMs);
  }

  override run(input: Parameters<BuiltInAgent['run']>[0]): ReturnType<BuiltInAgent['run']> {
    const timeout = setTimeout(() => this.abortRun(), this.timeoutMs);
    timeout.unref?.();
    return super.run(input);
  }
}

export const buildMoneyMateAgent = (
  user: AuthenticatedUser,
  config: CopilotKitConfig,
  context: MoneyMateAgentContext = {},
): BuiltInAgent => {
  const agentConfig: BuiltInAgentClassicConfig = {
    model: config.model,
    apiKey: config.openaiApiKey,
    prompt: MONEY_MATE_COPILOT_PROMPT,
    maxSteps: config.maxSteps,
    maxOutputTokens: config.maxOutputTokens,
    maxRetries: 1,
    temperature: 0.3,
    tools: buildFinancialTools(user.id, { requestId: context.requestId }),
    overridableProperties: [],
    forwardSystemMessages: false,
    forwardDeveloperMessages: false,
  };
  return new TimedBuiltInAgent(agentConfig, config.modelTimeoutMs);
};
