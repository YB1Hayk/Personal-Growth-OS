import { Request, Response } from 'express';
import { ContentService } from './content.service';
import { generatePostSchema, updatePostSchema } from './content.schema';
import { z } from 'zod';

const contentService = new ContentService();


export class ContentController {
  async generatePlan(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const posts = await contentService.generateWeeklyPlan(id);
      res.status(201).json({ success: true, data: posts });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getProjectPosts(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const posts = await contentService.getPostsByProject(id);
      res.status(200).json({ success: true, data: posts });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async generatePost(req: Request, res: Response): Promise<void> {
    try {
      const { postId, strategy } = generatePostSchema.parse(req.body);
      const post = await contentService.generatePost(postId, strategy);
      res.status(200).json({ success: true, data: post });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async deletePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await contentService.deletePost(id);
      res.json({ success: true, message: 'Сегмент удален' });
    } catch (e) { res.status(e instanceof z.ZodError ? 400 : 409).json({ success: false, message: e instanceof z.ZodError ? 'Некорректные данные' : 'Операция недоступна для этого поста' }); }
  }

  async clearQueue(req: Request, res: Response): Promise<void> {
    try {
      const { id: projectId } = req.params;
      await contentService.clearProjectQueue(projectId);
      res.json({ success: true, message: 'Очередь очищена' });
    } catch (e) { res.status(e instanceof z.ZodError ? 400 : 409).json({ success: false, message: e instanceof z.ZodError ? 'Некорректные данные' : 'Операция недоступна для этого поста' }); }
  }

  async updatePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, content, scheduledAt } = updatePostSchema.parse(req.body);
      const post = await contentService.updatePost(id, {
        title,
        content,
        scheduledAt: scheduledAt === null ? null : scheduledAt ? new Date(scheduledAt) : undefined
      });
      res.json({ success: true, data: post });
    } catch (e) { res.status(e instanceof z.ZodError ? 400 : 409).json({ success: false, message: e instanceof z.ZodError ? 'Некорректные данные' : 'Операция недоступна для этого поста' }); }
  }

  // НАШ НОВЫЙ МЕТОД
  async approvePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await contentService.approvePost(id);
      res.status(200).json({ success: true, message: 'Пост одобрен' });
    } catch (error) {
      res.status(409).json({ success: false, message: 'Нельзя одобрить пустой, отправляемый или опубликованный пост' });
    }
  }
}