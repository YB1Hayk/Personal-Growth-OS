import { z } from 'zod';

export const createInsightSchema = z.object({
  body: z.object({
    projectId: z.string().uuid(),
    content: z.string().min(1),
    category: z.string().min(1), // боль / запрос / тренд
    source: z.string().url().optional().nullable().or(z.literal('')),
  })
});

export const scanMarketSchema = z.object({
  body: z.object({
    url: z.string().url(),
  })
});
