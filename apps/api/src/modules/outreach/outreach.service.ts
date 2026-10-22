import { prisma } from '../../shared/lib/prisma'
import { outreachRepository } from './outreach.repository'
import { CreateTemplateDto } from './outreach.types'
import { aiProvider } from '../../shared/ai'
import axios from 'axios'

/**
 * Заменяет переменные вида {name}, {username} в тексте шаблона
 * на реальные данные лида.
 */
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

export const outreachService = {
  /**
   * Отправляет персонализированное сообщение лиду через Telegram Bot API.
   * Берёт tgBotToken из связанного Project.
   */
  sendTemplate: async (leadId: string, templateId: string): Promise<void> => {
    // 1. Найти лида
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { project: true },
    })
    if (!lead) throw new Error('Лид не найден')

    // 2. Найти шаблон
    const template = await outreachRepository.findTemplateById(templateId)
    if (!template) throw new Error('Шаблон не найден')
    if (template.projectId !== lead.projectId) throw new Error('Лид и шаблон относятся к разным проектам')

    // 3. Проверить токен
    const { tgBotToken } = lead.project
    if (!tgBotToken) throw new Error('У проекта не настроен Telegram Bot Token')

    // 4. Личные сообщения доступны только по chat_id пользователя, запустившего бота.
    const rawContact = lead.handle.trim()
    if (!/^\d+$/.test(rawContact)) throw new Error('Для личного сообщения нужен числовой Telegram chat_id пользователя, который уже запустил бота. Отправка по @username не поддерживается.');
    const chatId = rawContact

    // 5. Подставить переменные
    const message = interpolate(template.content, {
      name: lead.name,
      username: rawContact.replace('@', ''),
    })

    // 6. Отправить через Bot API
    let status: 'SENT' | 'FAILED' = 'SENT'
    try {
      await axios.post(
        `https://api.telegram.org/bot${tgBotToken}/sendMessage`,
        { chat_id: chatId, text: message },
        { timeout: 10000 },
      )
    } catch (err) {
      status = 'FAILED'
      console.error('Failed to send outreach message', { leadId, templateId })
    }

    // 7. Записать лог
    await outreachRepository.logMessage(leadId, templateId, message, status)

    if (status === 'SENT') await prisma.lead.update({ where: { id: leadId }, data: { lastContact: new Date() } });

    if (status === 'FAILED') {
      throw new Error('Сообщение не удалось отправить в Telegram')
    }
  },

  getTemplates: (projectId: string) =>
    outreachRepository.findTemplatesByProject(projectId),

  createTemplate: (dto: CreateTemplateDto) =>
    outreachRepository.createTemplate(dto),

  deleteTemplate: async (id: string): Promise<void> => {
    const exists = await outreachRepository.findTemplateById(id)
    if (!exists) throw new Error('Шаблон не найден')
    await outreachRepository.deleteTemplate(id)
  },

  updateTemplate: async (id: string, data: { name?: string; content?: string }) => {
    const exists = await outreachRepository.findTemplateById(id)
    if (!exists) throw new Error('Шаблон не найден')
    return outreachRepository.updateTemplate(id, data)
  },

  getLogsByLead: (leadId: string) =>
    outreachRepository.findLogsByLead(leadId),

  /**
   * Генерация персонализированного сообщения через ИИ
   */
  generateAIMessage: async (dto: { leadId: string; projectId: string; insightId?: string }): Promise<string> => {
    // 1. Получаем контекст: Проект, Лид, Инсайт
    const project = await prisma.project.findUnique({ where: { id: dto.projectId } });
    const lead = await prisma.lead.findUnique({ where: { id: dto.leadId } });
    
    // Берем либо конкретный инсайт, либо последний из этого проекта
    const insight = dto.insightId 
      ? await prisma.marketInsight.findUnique({ where: { id: dto.insightId } })
      : await prisma.marketInsight.findFirst({ 
          where: { projectId: dto.projectId }, 
          orderBy: { createdAt: 'desc' } 
        });

    if (!project || !lead) throw new Error('Project or Lead not found');
    if (lead.projectId !== project.id || (insight && insight.projectId !== project.id)) throw new Error('Лид или инсайт относится к другому проекту');

    const prompt = `
Ты — AI Sales Агент в системе Growth OS. Твоя задача — написать короткое, цепляющее и крайне персонализированное сообщение в Telegram/Email.

КОНТЕКСТ ПРОЕКТА (DNA):
${project.dna || 'Общий бизнес-консалтинг'}

ГОЛОС БРЕНДА:
${project.brandVoice || 'Профессиональный, дружелюбный'}

ДАННЫЕ ЛИДА:
Имя: ${lead.name}
Handle: ${lead.handle}

РЫНОЧНЫЙ ИНСАЙТ (используй это как зацепку):
${insight ? insight.content : 'Общие тренды эффективности и роста'}

ПРАВИЛА:
1. Пиши кратко (не более 3-4 предложений).
2. Обращайся по имени.
3. Не используй шаблонные фразы "Надеюсь, у вас все хорошо".
4. Сделай акцент на инсайте и на том, как наш проект (DNA) решает эту задачу.
5. Заверши легким вопросом.

ОТВЕТЬ ТОЛЬКО ТЕКСТОМ СООБЩЕНИЯ.
`;

    const message = await aiProvider.chat([
      { role: 'system', content: 'You are an elite sales outreach expert. Write in Russian.' },
      { role: 'user', content: prompt }
    ], { temperature: 0.3 });

    return message || 'Не удалось сгенерировать сообщение.';
  }
}
