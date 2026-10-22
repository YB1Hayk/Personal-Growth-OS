import { z } from 'zod'

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Название обязательно'),
    content: z.string().min(1, 'Текст шаблона обязателен'),
    projectId: z.string().uuid('Некорректный projectId'),
  }),
})

export const sendTemplateSchema = z.object({
  body: z.object({
    leadId: z.string().uuid('Некорректный leadId'),
    templateId: z.string().uuid('Некорректный templateId'),
  }),
})
