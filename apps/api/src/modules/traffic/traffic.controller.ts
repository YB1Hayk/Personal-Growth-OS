import { Request, Response } from 'express';
import { trafficService } from './traffic.service';
import { createLinkSchema, updateLinkSchema, postbackSchema } from './traffic.schema';

export const trafficController = {
  createLink: async (req: Request, res: Response) => {
    const parsed = createLinkSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      return res.status(400).json({ data: null, error: parsed.error.errors[0].message, meta: null });
    }
    const link = await trafficService.createLink(parsed.data.body);
    res.status(201).json({ data: link, error: null, meta: null });
  },

  getStats: async (req: Request, res: Response) => {
    const projectId = req.query.projectId as string;
    if (!projectId) {
      return res.status(400).json({ data: null, error: 'projectId обязателен', meta: null });
    }
    const stats = await trafficService.getLinkStats(projectId);
    res.json({ data: stats, error: null, meta: { count: stats.length } });
  },

  updateLink: async (req: Request, res: Response) => {
    const parsed = updateLinkSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      return res.status(400).json({ data: null, error: parsed.error.errors[0].message, meta: null });
    }
    try {
      const link = await trafficService.updateLink(req.params.id, parsed.data.body);
      res.json({ data: link, error: null, meta: null });
    } catch (e: any) {
      res.status(404).json({ data: null, error: e.message, meta: null });
    }
  },

  deleteLink: async (req: Request, res: Response) => {
    try {
      await trafficService.deleteLink(req.params.id);
      res.json({ data: { ok: true }, error: null, meta: null });
    } catch (e: any) {
      res.status(404).json({ data: null, error: e.message, meta: null });
    }
  },

  /**
   * GET /go/:slug — публичный редирект. Пишет клик, ведёт на targetUrl.
   */
  redirect: async (req: Request, res: Response) => {
    const target = await trafficService.registerClick(req.params.slug, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
    });
    if (!target) return res.status(404).send('Link not found');
    res.redirect(302, target);
  },

  /**
   * GET /api/traffic/postback — S2S от партнёрки.
   * Пример: /api/traffic/postback?clickid={clickid}&type=deposit&payout=100
   */
  postback: async (req: Request, res: Response) => {
    const parsed = postbackSchema.safeParse({ query: req.query });
    if (!parsed.success) {
      return res.status(400).json({ data: null, error: parsed.error.errors[0].message, meta: null });
    }
    try {
      const conv = await trafficService.registerPostback({
        ...parsed.data.query,
        raw: new URLSearchParams({ clickid: parsed.data.query.clickid, eventid: parsed.data.query.eventid, type: parsed.data.query.type, payout: String(parsed.data.query.payout) }).toString(),
      });
      res.json({ data: { id: conv.id }, error: null, meta: null });
    } catch (e: any) {
      res.status(404).json({ data: null, error: e.message, meta: null });
    }
  },
};
