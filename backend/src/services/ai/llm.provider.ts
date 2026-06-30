import { aiConfig } from '../../config/ai';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class LlmProvider {
  isAvailable(): boolean {
    return aiConfig.enabled;
  }

  async chat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    if (!this.isAvailable()) {
      return '';
    }

    try {
      const { default: OpenAI } = await import('openai');
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

  async analyzeImage(base64: string, mimeType: string, prompt: string): Promise<string> {
    if (!this.isAvailable()) return '';

    try {
      const { default: OpenAI } = await import('openai');
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
