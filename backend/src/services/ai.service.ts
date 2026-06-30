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

  analyzeExpenses(userId: string, month?: number, year?: number) {
    return this.analysis.analyzeExpenses(userId, month, year);
  }

  budgetForecast(userId: string, month?: number, year?: number) {
    return this.forecast.forecast(userId, month, year);
  }

  getAdvisorInsights(userId: string) {
    return this.advisor.getRecommendations(userId);
  }

  scanReceipt(userId: string, file: Express.Multer.File) {
    return this.receiptOcr.scanReceipt(userId, file);
  }

  chat(userId: string, message: string, history?: ChatMessage[]) {
    return this.chatService.chat(userId, message, history);
  }

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
