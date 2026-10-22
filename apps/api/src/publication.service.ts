import { prisma } from './shared/lib/prisma';
import { AppError } from './shared/lib/AppError';
import { PublishService } from './publish.service';

export async function publishPost(id: string, scheduled = false) {
  const post = await prisma.contentPost.findUnique({ where: { id }, include: { project: true } });
  if (!post) throw new AppError('Пост не найден', 404, 'NOT_FOUND');
  if (!post.content?.trim()) throw new AppError('Текст поста пуст', 400, 'EMPTY_CONTENT');
  if (!post.project.tgBotToken || !post.project.tgChatId)
    throw new AppError('Настройте Telegram в проекте', 400, 'TELEGRAM_NOT_CONFIGURED');

  const claim = await prisma.contentPost.updateMany({
    where: {
      id,
      status: scheduled ? 'APPROVED' : { in: ['DRAFT', 'APPROVED'] },
      updatedAt: post.updatedAt,
      ...(scheduled ? { scheduledAt: { lte: new Date() } } : {}),
    },
    data: { status: 'PUBLISHING' },
  });
  if (claim.count !== 1) throw new AppError('Пост изменён, уже отправляется или опубликован', 409, 'PUBLICATION_CONFLICT');

  try {
    await PublishService.sendToTelegram(post.project.tgBotToken, post.project.tgChatId, post.content);
    return await prisma.contentPost.update({ where: { id }, data: { status: 'PUBLISHED' } });
  } catch {
    // Таймаут не означает, что Telegram не принял сообщение. НЕ повторяем автоматически.
    await prisma.contentPost.updateMany({ where: { id, status: 'PUBLISHING' }, data: { status: 'PUBLISH_UNKNOWN' } });
    throw new AppError('Результат отправки не подтверждён. Проверьте канал перед повторной публикацией.', 502, 'PUBLICATION_UNKNOWN');
  }
}
