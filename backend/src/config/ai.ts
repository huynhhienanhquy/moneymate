export const aiConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.AI_MODEL || 'gpt-4o-mini',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1500', 10),
  enabled: Boolean(process.env.OPENAI_API_KEY),
};

/**
 * Format a monetary amount for display in Vietnamese dong.
 *
 * Use it while deriving the application's ai settings.
 * @param n - The numeric value to format or calculate.
 * @returns The resulting ai value for the caller.
 */
export const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
