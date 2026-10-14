import { BuiltInAgent, type BuiltInAgentClassicConfig } from '@copilotkit/runtime/v2';
import { CopilotKitConfig } from '../config/copilotkit';
import { AuthenticatedUser } from '../middlewares/auth';
import { buildFinancialTools } from './financial-tools';
import { MONEY_MATE_COPILOT_PROMPT } from './prompt';

export interface MoneyMateAgentContext {
  requestId?: string;
}

class TimedBuiltInAgent extends BuiltInAgent {
  /**
   * Initialize a financial agent instance with its required dependencies.
   *
   * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial agent rules.
   * @param agentConfig - The agent config value required by the operation.
   * @param timeoutMs - The timeout ms value required by the operation.
   */
  constructor(
    private readonly agentConfig: BuiltInAgentClassicConfig,
    private readonly timeoutMs: number,
  ) {
    super(agentConfig);
  }

  /**
   * Create an isolated financial-agent instance with the same trusted configuration.
   *
   * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial agent rules.
   * @returns The resulting financial agent value for the caller.
   */
  override clone(): BuiltInAgent {
    return new TimedBuiltInAgent(this.agentConfig, this.timeoutMs);
  }

  /**
   * Run one financial-agent request and return its validated response.
   *
   * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial agent rules.
   * @param input - The input data required to run for financial agent.
   * @returns The resulting financial agent value for the caller.
   */
  override run(input: Parameters<BuiltInAgent['run']>[0]): ReturnType<BuiltInAgent['run']> {
    const timeout = setTimeout(() => this.abortRun(), this.timeoutMs);
    timeout.unref?.();
    return super.run(input);
  }
}

/**
 * Build money mate agent used by the financial agent workflow.
 *
 * Use it at the CopilotKit boundary so AI-driven operations follow the application's financial agent rules.
 * @param user - The user value required by the operation.
 * @param config - Settings that customize how the operation runs.
 * @param context - The context value required by the operation.
 * @returns The resulting financial agent value for the caller.
 */
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
