import { z } from 'zod';

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(4000),
    projectId: z.string().uuid(),
    conversationId: z.string().uuid().optional(),
  })
});
