import { z } from 'zod';
const httpUrl = z.string().url('Неверный URL').refine(value => ['http:', 'https:'].includes(new URL(value).protocol), 'Только HTTP(S)');

export const createLinkSchema = z.object({
  body: z.object({
    projectId: z.string().uuid('Неверный ID проекта'),
    name: z.string().min(1, 'Имя связки обязательно'),
    source: z.string().min(1, 'Источник обязателен'),
    creative: z.string().optional().nullable(),
    targetUrl: httpUrl,
    cost: z.number().min(0).optional(),
  }),
});

export const updateLinkSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    source: z.string().min(1).optional(),
    creative: z.string().optional().nullable(),
    targetUrl: httpUrl.optional(),
    cost: z.number().min(0).optional(),
  }),
});

// Постбек от партнёрки: GET с макросами. clickid обязателен —
// он же ClickEvent.id, который мы передали в редиректе.
export const postbackSchema = z.object({
  query: z.object({
    clickid: z.string().uuid('Неверный clickid'),
    eventid: z.string().trim().min(1).max(128),
    type: z.enum(['registration', 'deposit', 'other']).default('other'),
    payout: z.coerce.number().finite().min(0).default(0),
  }),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>['body'];
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>['body'];
