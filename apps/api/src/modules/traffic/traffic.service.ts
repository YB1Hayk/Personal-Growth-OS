import { trafficRepository } from './traffic.repository';
import { CreateLinkInput, UpdateLinkInput } from './traffic.schema';

export interface LinkStats {
  id: string;
  name: string;
  slug: string;
  source: string;
  creative: string | null;
  targetUrl: string;
  cost: number;
  clicks: number;
  registrations: number;
  deposits: number;
  revenue: number;
  roi: number | null; // null, когда cost = 0 (ROI не определён)
  createdAt: Date;
}

export const trafficService = {
  createLink: (dto: CreateLinkInput) => trafficRepository.createLink(dto),

  updateLink: async (id: string, dto: UpdateLinkInput) => {
    const exists = await trafficRepository.findLinkById(id);
    if (!exists) throw new Error('Связка не найдена');
    return trafficRepository.updateLink(id, dto);
  },

  deleteLink: async (id: string) => {
    const exists = await trafficRepository.findLinkById(id);
    if (!exists) throw new Error('Связка не найдена');
    await trafficRepository.deleteLink(id);
  },

  /**
   * Регистрирует клик и возвращает конечный URL с проставленными
   * clickid + UTM. clickid дальше возвращается к нам постбеком.
   */
  registerClick: async (
    slug: string,
    meta: { ip?: string; userAgent?: string; referer?: string },
  ): Promise<string | null> => {
    const link = await trafficRepository.findLinkBySlug(slug);
    if (!link) return null;

    const click = await trafficRepository.createClick(link.id, meta);

    const url = new URL(link.targetUrl);
    url.searchParams.set('clickid', click.id);
    url.searchParams.set('utm_source', link.source);
    if (link.creative) url.searchParams.set('utm_content', link.creative);
    return url.toString();
  },

  /**
   * S2S-постбек от партнёрки: привязывает конверсию к клику и связке.
   */
  registerPostback: async (params: { clickid: string; eventid: string; type: string; payout: number; raw?: string }) => {
    const click = await trafficRepository.findClickById(params.clickid);
    if (!click) throw new Error('Клик с таким clickid не найден');

    const data = { externalId: params.eventid, linkId: click.linkId, clickId: click.id,
      type: params.type.toUpperCase(), payout: params.payout, raw: params.raw };
    const checkExisting = (existing: { clickId: string | null; type: string; payout: number }) => {
      if (existing.clickId !== data.clickId || existing.type !== data.type || existing.payout !== data.payout)
        throw new Error('eventid уже использован для другой конверсии');
      return existing;
    };
    const existing = await trafficRepository.findConversionByExternalId(params.eventid);
    if (existing) { checkExisting(existing); return existing; }
    try { return await trafficRepository.createConversion(data); }
    catch (error) {
      // Unique DB constraint handles concurrent duplicates, not just sequential retries.
      if ((error as { code?: string }).code !== 'P2002') throw error;
      const duplicate = await trafficRepository.findConversionByExternalId(params.eventid);
      if (!duplicate) throw error;
      checkExisting(duplicate);
      return duplicate;
    }
  },

  /**
   * Дашборд связок: клики, конверсии по типам, доход, ROI.
   */
  getLinkStats: async (projectId: string): Promise<LinkStats[]> => {
    const links = await trafficRepository.findLinksByProject(projectId);
    if (links.length === 0) return [];

    const ids = links.map(l => l.id);
    const [clickCounts, convStats] = await Promise.all([
      trafficRepository.clickCountsByLink(ids),
      trafficRepository.conversionStatsByLink(ids),
    ]);

    const clicksMap = new Map(clickCounts.map(c => [c.linkId, c._count._all]));

    return links.map(link => {
      const convs = convStats.filter(c => c.linkId === link.id);
      const registrations = convs
        .filter(c => c.type === 'REGISTRATION')
        .reduce((s, c) => s + c._count._all, 0);
      const deposits = convs
        .filter(c => c.type === 'DEPOSIT')
        .reduce((s, c) => s + c._count._all, 0);
      const revenue = convs.reduce((s, c) => s + (c._sum.payout ?? 0), 0);
      const roi = link.cost > 0 ? (revenue - link.cost) / link.cost : null;

      return {
        id: link.id,
        name: link.name,
        slug: link.slug,
        source: link.source,
        creative: link.creative,
        targetUrl: link.targetUrl,
        cost: link.cost,
        clicks: clicksMap.get(link.id) ?? 0,
        registrations,
        deposits,
        revenue,
        roi,
        createdAt: link.createdAt,
      };
    });
  },
};
