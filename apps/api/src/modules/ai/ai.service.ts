import { z } from 'zod';
import { aiProvider } from '../../shared/ai';
import { ProjectsRepository, Project } from '../projects/projects.repository';
import { ChatDto } from './ai.types';

const projectsRepository = new ProjectsRepository();

function buildSystemPrompt(project: Project): string {
  return `Ты — AI-ассистент Growth OS для проекта "${project.name}" (ниша: ${project.niche}).
DNA проекта: ${project.dna ?? 'не задано'}
Голос бренда: ${project.brandVoice ?? 'не задано'}
Целевая аудитория: ${project.targetAudience ?? 'не задано'}

Отвечай по-русски. Будь конкретен, помогай строить бизнес и развивать контент. Тон общения: профессиональный, с легким индастриал/техническим уклоном. Не давай абстрактных общих советов — только четкие гипотезы и шаги.`;
}

export const aiService = {
  chat: async (dto: ChatDto): Promise<string> => {
    // 1. Загружаем контекст проекта
    const project = await projectsRepository.findById(dto.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // 2. Строим системный промпт
    const systemPrompt = buildSystemPrompt(project);

    // 3. Вызываем AI-провайдер (OpenRouter по умолчанию)
    const content = await aiProvider.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: dto.message }
    ]);

    return content || 'Нет ответа';
  },

  extractMarketInsight: async (text: string): Promise<any> => {
    const prompt = `
Анализируй следующее сообщение и выдели из него ОДИН ключевой рыночный инсайт (боль клиента, конкретный запрос или рыночный тренд).

Верни ответ СТРОГО в формате JSON:
{
  "content": "текст инсайта",
  "category": "боль" | "запрос" | "тренд",
  "source": "ссылка если есть, иначе null"
}

СООБЩЕНИЕ:
${text}
`;

    const content = await aiProvider.chatJSON([
      { role: 'system', content: 'You are a market analyst. Respond ONLY with valid JSON.' },
      { role: 'user', content: prompt }
    ], { temperature: 0.3 });

    return z.object({ content: z.string().trim().min(1), category: z.enum(['боль', 'запрос', 'тренд']), source: z.string().url().nullable().optional() }).parse(JSON.parse(content || '{}'));
  }
};
