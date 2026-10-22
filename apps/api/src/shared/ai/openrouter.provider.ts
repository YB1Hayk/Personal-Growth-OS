import { OpenAI } from 'openai';
import { config } from '../lib/config';
import { AIChatMessage, AIProvider, AIRequestOptions } from './types';

/**
 * OpenRouter exposes an OpenAI-compatible endpoint, so the OpenAI SDK works
 * as-is against it — only baseURL and model string change. Model list:
 * https://openrouter.ai/models (e.g. "deepseek/deepseek-chat", "anthropic/claude-...").
 */
export class OpenRouterProvider implements AIProvider {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    const apiKey = config.ai.openrouter.apiKey;
    // Без явной проверки OpenAI SDK молча подхватил бы OPENAI_API_KEY из
    // окружения и отправил ключ OpenAI на OpenRouter (гарантированный 401).
    if (!apiKey) {
      throw new Error(
        'OPENROUTER_API_KEY не задан в apps/api/.env — получи ключ на https://openrouter.ai/keys или переключись на AI_PROVIDER=openai'
      );
    }
    this.client = new OpenAI({
      apiKey,
      timeout: 30000,
      maxRetries: 1,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    this.model = config.ai.openrouter.model;
  }

  async generateText(prompt: string, options?: AIRequestOptions): Promise<string> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chat(messages: AIChatMessage[], options?: AIRequestOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: options?.temperature,
    });
    return response.choices[0].message.content ?? '';
  }

  async chatJSON(messages: AIChatMessage[], options?: AIRequestOptions): Promise<string> {
    // Not every model routed through OpenRouter supports response_format,
    // but OpenAI-family and many others do; callers already defend against
    // non-JSON replies (regex extraction / try-catch) for the rest.
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: options?.temperature,
      response_format: { type: 'json_object' },
    });
    return response.choices[0].message.content ?? '{}';
  }
}
