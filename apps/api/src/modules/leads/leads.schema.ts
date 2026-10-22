import { z } from 'zod';

export const createLeadSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Имя обязательно'),
    contact: z.string().min(1, 'Контакт обязателен'),
    source: z.string().min(1, 'Источник обязателен'),
    status: z.string().optional(),
    projectId: z.string().uuid('Неверный ID проекта'),
    note: z.string().optional().nullable(),
  }),
});

export const updateLeadSchema = z.object({
  body: z.object({
    status: z.string().optional(),
    note: z.string().optional().nullable(),
  }),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>['body'];
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>['body'];
