import { OpenAI } from 'openai';
import { config } from './config';

export const openaiClient = new OpenAI({
  apiKey: config.openai.apiKey,
});

export const openAIService = {
  generateText: async (prompt: string, model: string = 'gpt-4o'): Promise<string> => {
    try {
      const response = await openaiClient.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
      });
      return response.choices[0].message.content || '';
    } catch (error: any) {
      console.error('❌ OpenAI Error:', error.message);
      throw new Error('Ошибка генерации текста через OpenAI');
    }
  },
  chat: async (messages: any[], model: string = 'gpt-4o'): Promise<any> => {
    try {
      return await openaiClient.chat.completions.create({
        model,
        messages,
      });
    } catch (error: any) {
      console.error('❌ OpenAI Chat Error:', error.message);
      throw new Error('Ошибка чата через OpenAI');
    }
  },
};
