import { AnalysisService } from './ai/analysis.service';
import { BudgetForecastService } from './ai/budget-forecast.service';
import { AdvisorService } from './ai/advisor.service';
import { ReceiptOcrService } from './ai/receipt-ocr.service';
import { ChatService } from './ai/chat.service';
import { ChatMessage } from './ai/llm.provider';
import { aiConfig } from '../config/ai';

export class AiService {
  private analysis = new AnalysisService();
  private forecast = new BudgetForecastService();
  private advisor = new AdvisorService();
  private receiptOcr = new ReceiptOcrService();
  private chatService = new ChatService();

  /**
   * Analyze expenses for ai.
   *
   * Use it from controllers or jobs that run the ai business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param month - The date or reporting period used by the operation.
   * @param year - The date or reporting period used by the operation.
   * @returns The resulting ai value for the caller.
   */
  analyzeExpenses(userId: string, month?: number, year?: number) {
    return this.analysis.analyzeExpenses(userId, month, year);
  }

  /**
   * Budget forecast for ai.
   *
   * Use it from controllers or jobs that run the ai business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param month - The date or reporting period used by the operation.
   * @param year - The date or reporting period used by the operation.
   * @returns The resulting ai value for the caller.
   */
  budgetForecast(userId: string, month?: number, year?: number) {
    return this.forecast.forecast(userId, month, year);
  }

  /**
   * Return advisor insights required by the ai workflow.
   *
   * Use it from controllers or jobs that run the ai business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @returns The resulting ai value for the caller.
   */
  getAdvisorInsights(userId: string) {
    return this.advisor.getRecommendations(userId);
  }

  /**
   * Scan receipt for ai.
   *
   * Use it from controllers or jobs that run the ai business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param file - The file-system location or file value used by the operation.
   * @returns The resulting ai value for the caller.
   */
  scanReceipt(userId: string, file: Express.Multer.File) {
    return this.receiptOcr.scanReceipt(userId, file);
  }

  /**
   * Chat for ai.
   *
   * Use it from controllers or jobs that run the ai business workflow.
   * @param userId - The identifier of the user whose data is being processed.
   * @param message - The human-readable outcome message returned to the caller.
   * @param history - The history value required by the operation.
   * @returns The resulting ai value for the caller.
   */
  chat(userId: string, message: string, history?: ChatMessage[]) {
    return this.chatService.chat(userId, message, history);
  }

  /**
   * Return status required by the ai workflow.
   *
   * Use it from controllers or jobs that run the ai business workflow.
   * @returns The resulting ai value for the caller.
   */
  getStatus() {
    return {
      aiEnabled: aiConfig.enabled,
      model: aiConfig.enabled ? aiConfig.model : 'rule-based',
      features: {
        expenseAnalysis: true,
        budgetPrediction: true,
        financialAdvisor: true,
        receiptOcr: true,
        chatbot: true,
        enhancedWithLlm: aiConfig.enabled,
      },
    };
  }
}
