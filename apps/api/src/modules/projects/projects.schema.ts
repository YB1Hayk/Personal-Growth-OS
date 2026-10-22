import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Название обязательно'),
    niche: z.string().min(1, 'Ниша обязательна'),
    description: z.string().optional(),
    currentFocus: z.string().max(500).optional().nullable(),
    targetAudience: z.string().optional(),
    dna: z.string().optional(),
    brandVoice: z.string().optional(),
    sourceUrl: z.string().url().optional().or(z.literal('')),
    tgBotToken: z.string().optional(),
    tgChatId: z.string().optional(),
    planGenerationDay: z.number().int().min(0).max(6).optional().nullable(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    niche: z.string().min(1).optional(),
    description: z.string().optional(),
    currentFocus: z.string().max(500).optional().nullable(),
    targetAudience: z.string().optional(),
    dna: z.string().optional(),
    brandVoice: z.string().optional(),
    sourceUrl: z.string().url().optional().or(z.literal('')),
    tgBotToken: z.string().optional(),
    tgChatId: z.string().optional(),
    planGenerationDay: z.number().int().min(0).max(6).optional().nullable(),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
