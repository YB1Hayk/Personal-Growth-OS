import { z } from 'zod';
export const generatePostSchema = z.object({
  postId: z.string().uuid(),
  strategy: z.enum(['PAIN_SOLVE', 'STORYTELLING']).optional(),
});
export const updatePostSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  content: z.string().max(4096).nullable().optional(),
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
}).strict().refine(data => Object.keys(data).length > 0, 'Изменения отсутствуют');
export const weeklyPlanSchema = z.array(z.object({
  title: z.string().trim().min(1).max(300),
  content: z.string().trim().min(1).max(4096),
})).length(7);
