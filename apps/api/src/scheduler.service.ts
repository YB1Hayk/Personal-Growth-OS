import cron from 'node-cron';
import { prisma } from './shared/lib/prisma';
import { publishPost } from './publication.service';

export const initScheduler = () => cron.schedule('* * * * *', async () => {
  try {
    const posts = await prisma.contentPost.findMany({
      where: { status: 'APPROVED', scheduledAt: { lte: new Date() } },
      select: { id: true },
    });
    for (const post of posts) {
      try { await publishPost(post.id, true); }
      catch { console.error('[Scheduler] Не удалось опубликовать пост', post.id); }
    }
  } catch { console.error('[Scheduler] Не удалось прочитать очередь'); }
}, { noOverlap: true });
