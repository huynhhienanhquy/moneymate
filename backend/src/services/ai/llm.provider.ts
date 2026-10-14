import { aiConfig } from '../../config/ai';
import OpenAI from 'openai';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class LlmProvider {
  /**
   * Determine whether available applies.
   *
   * Use it from controllers or jobs that run the llm.provider business workflow.
   * @returns `true` when the condition is satisfied; otherwise `false`.
   */
  isAvailable(): boolean {
    return aiConfig.enabled;
  }

  /**
   * Chat for llm.provider.
   *
   * Use it from controllers or jobs that run the llm.provider business workflow.
   * @param messages - The messages value required by the operation.
   * @param systemPrompt - The system prompt value required by the operation.
   * @returns A promise containing the resulting llm.provider value.
   */
  async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    if (!this.isAvailable()) {
      return '';
    }

    try {
      const client = new OpenAI({ apiKey: aiConfig.openaiApiKey });

      const response = await client.chat.completions.create({
        model: aiConfig.model,
        max_tokens: aiConfig.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (err) {
      console.error('LLM call failed:', err);
      return '';
    }
  }

  /**
   * Analyze image for llm.provider.
   *
   * Use it from controllers or jobs that run the llm.provider business workflow.
   * @param base64 - The base64 value required by the operation.
   * @param mimeType - The operation or report variant to process.
   * @param prompt - The prompt value required by the operation.
   * @returns A promise containing the resulting llm.provider value.
   */
  async analyzeImage(base64: string, mimeType: string, prompt: string): Promise<string> {
    if (!this.isAvailable()) return '';

    try {
      const client = new OpenAI({ apiKey: aiConfig.openaiApiKey });

      const response = await client.chat.completions.create({
        model: aiConfig.model,
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        }],
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (err) {
      console.error('Vision API failed:', err);
      return '';
    }
  }
}
