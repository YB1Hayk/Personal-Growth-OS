import { OpenAI } from 'openai';
import { config } from '../lib/config';
import { AIChatMessage, AIProvider, AIRequestOptions } from './types';

/**
 * Альтернативная реализация AIProvider поверх прямого OpenAI API
 * (config.ai.provider = 'openai'). Создаёт собственный клиент, а не
 * импортирует shared/lib/openai.ts — тот конструирует клиент при импорте
 * и уронил бы сервер на старте, если OPENAI_API_KEY не задан.
 */
export class OpenAIProvider implements AIProvider {
  private readonly client: OpenAI;

  constructor(private readonly model: string = 'gpt-4o') {
    const apiKey = config.openai.apiKey;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY не задан в apps/api/.env, а AI_PROVIDER=openai');
    }
    this.client = new OpenAI({ apiKey, timeout: 30000, maxRetries: 1 });
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
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: options?.temperature,
      response_format: { type: 'json_object' },
    });
    return response.choices[0].message.content ?? '{}';
  }
}
