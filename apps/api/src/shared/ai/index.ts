import { config } from '../lib/config';
import { AIChatMessage, AIProvider, AIRequestOptions } from './types';
import { OpenRouterProvider } from './openrouter.provider';
import { OpenAIProvider } from './openai.provider';

function createAIProvider(): AIProvider {
  switch (config.ai.provider) {
    case 'openai':
      return new OpenAIProvider();
    case 'openrouter':
    default:
      return new OpenRouterProvider();
  }
}

// Ленивая инициализация: провайдер создаётся при первом AI-вызове, а не при
// импорте модуля. Иначе сервер не стартует без API-ключа, даже если AI не нужен.
let instance: AIProvider | undefined;

function getProvider(): AIProvider {
  if (!instance) instance = createAIProvider();
  return instance;
}

export const aiProvider: AIProvider = {
  generateText: (prompt: string, options?: AIRequestOptions) =>
    getProvider().generateText(prompt, options),
  chat: (messages: AIChatMessage[], options?: AIRequestOptions) =>
    getProvider().chat(messages, options),
  chatJSON: (messages: AIChatMessage[], options?: AIRequestOptions) =>
    getProvider().chatJSON(messages, options),
};

export * from './types';
