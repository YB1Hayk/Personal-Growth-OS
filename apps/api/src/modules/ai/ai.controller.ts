import { Request, Response, RequestHandler } from 'express';
import { aiService } from './ai.service';
import { ChatDto } from './ai.types';
import { z } from 'zod';

const asyncHandler = (fn: RequestHandler): RequestHandler => 
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const aiController = {
  chat: asyncHandler(async (req: Request, res: Response) => {
    // Валидация вынесена в роутер (ai.schema) - здесь мы просто берем данные
    const dto: ChatDto = z.object({ message: z.string().trim().min(1).max(4000), projectId: z.string().uuid() }).parse(req.body);

    if (!dto.message || !dto.projectId) {
      return res.status(400).json({
        data: null,
        error: { message: 'Message and projectId are required', code: 'BAD_REQUEST' },
        meta: null
      });
    }

    const reply = await aiService.chat(dto);

    res.json({
      data: reply,
      error: null,
      meta: null
    });
  }),

  extractInsight: asyncHandler(async (req: Request, res: Response) => {
    const { message } = z.object({ message: z.string().trim().min(1).max(8000) }).parse(req.body);
    if (!message) {
      return res.status(400).json({ data: null, error: { message: 'Message is required', code: 'BAD_REQUEST' }, meta: null });
    }

    const insight = await aiService.extractMarketInsight(message);

    res.json({
      data: insight,
      error: null,
      meta: null
    });
  }),
};

