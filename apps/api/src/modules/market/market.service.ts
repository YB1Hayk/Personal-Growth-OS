import { z } from 'zod';
import { fetchPublicHtml } from '../../shared/lib/public-web';
import { aiProvider } from '../../shared/ai';
import { marketRepository } from './market.repository';
import { CreateInsightDto, MarketInsight, MarketIntelligence } from './market.types';

export const marketService = {
  // --- Insights CRUD ---

  createInsight: async (dto: CreateInsightDto): Promise<MarketInsight> => {
    return marketRepository.createInsight(dto);
  },

  getInsightsByProject: async (projectId: string): Promise<MarketInsight[]> => {
    return marketRepository.findByProject(projectId);
  },

  // --- Scraper Logic (Migrated from root) ---

  fetchRawText: async (url: string): Promise<string> => {
    try {
      const html = await fetchPublicHtml(url);
      if (typeof html !== 'string') return '';

      let text = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, '');

      text = text.replace(/<[^>]+>/g, ' ');

      return text
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 8000); 
    } catch (e) {
      throw new Error('Не удалось прочитать сайт');
    }
  },

  extractIntelligence: async (text: string): Promise<MarketIntelligence> => {
    const prompt = `
Анализируй следующий текст с веб-сайта и выдели две сущности:
1. Core DNA (Философия, миссия, глубинный смысл проекта).
2. Brand Voice (Тональность, атмосфера, стиль общения).

Верни ответ СТРОГО в формате JSON:
{
  "dna": "текст философии",
  "brandVoice": "текст тональности"
}

ТЕКСТ:
${text}
`;

    const rawContent = await aiProvider.chat([
      { role: 'system', content: 'You are a professional brand strategist. Respond ONLY with valid JSON.' },
      { role: 'user', content: prompt }
    ], { temperature: 0.3 });

    try {
      const content = rawContent || '{}';
      const cleanJson = content.replace(/```json|```/g, '').trim();
      return z.object({ dna: z.string().trim().min(1), brandVoice: z.string().trim().min(1) }).parse(JSON.parse(cleanJson));
    } catch (e) {
      throw new Error('AI вернул некорректный формат анализа');
    }
  }
};
