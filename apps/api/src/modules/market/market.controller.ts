import { Request, Response } from 'express';
import { marketService } from './market.service';
import { createInsightSchema, scanMarketSchema } from './market.schema';
import { z } from 'zod';

export const marketController = {
  create: async (req: Request, res: Response) => {
    const insight = await marketService.createInsight(createInsightSchema.parse({ body: req.body }).body);
    res.status(201).json({ data: insight, error: null, meta: null });
  },

  getAllByProject: async (req: Request, res: Response) => {
    const projectId = z.string().uuid().parse(req.query.projectId);
    const insights = await marketService.getInsightsByProject(projectId as string);
    res.json({ data: insights, error: null, meta: { count: insights.length } });
  },

  scan: async (req: Request, res: Response) => {
    const { url } = scanMarketSchema.parse({ body: req.body }).body;
    const rawText = await marketService.fetchRawText(url);
    const intelligence = await marketService.extractIntelligence(rawText);

    res.json({
      data: intelligence,
      error: null
    });
  }
};
