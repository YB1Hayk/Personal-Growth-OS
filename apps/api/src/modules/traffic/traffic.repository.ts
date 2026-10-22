import { randomBytes } from 'node:crypto';
import { prisma } from '../../shared/lib/prisma';
import { CreateLinkInput, UpdateLinkInput } from './traffic.schema';

function generateSlug(): string {
  return randomBytes(9).toString('base64url');
}

export const trafficRepository = {
  createLink: (data: CreateLinkInput) =>
    prisma.trackingLink.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        source: data.source,
        creative: data.creative ?? null,
        targetUrl: data.targetUrl,
        cost: data.cost ?? 0,
        slug: generateSlug(),
      },
    }),

  findLinkById: (id: string) => prisma.trackingLink.findUnique({ where: { id } }),

  findLinkBySlug: (slug: string) => prisma.trackingLink.findUnique({ where: { slug } }),

  findLinksByProject: (projectId: string) =>
    prisma.trackingLink.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    }),

  updateLink: (id: string, data: UpdateLinkInput) =>
    prisma.trackingLink.update({ where: { id }, data }),

  deleteLink: (id: string) => prisma.trackingLink.delete({ where: { id } }),

  createClick: (linkId: string, meta: { ip?: string; userAgent?: string; referer?: string }) =>
    prisma.clickEvent.create({
      data: { linkId, ip: meta.ip, userAgent: meta.userAgent, referer: meta.referer },
    }),

  findClickById: (id: string) => prisma.clickEvent.findUnique({ where: { id } }),

  createConversion: (data: {
    externalId: string;
    linkId: string;
    clickId?: string;
    type: string;
    payout: number;
    raw?: string;
  }) => prisma.conversion.create({ data }),

  findConversionByExternalId: (externalId: string) => prisma.conversion.findUnique({ where: { externalId } }),

  // Агрегаты для дашборда: клики и конверсии по всем связкам проекта
  clickCountsByLink: (linkIds: string[]) =>
    prisma.clickEvent.groupBy({
      by: ['linkId'],
      where: { linkId: { in: linkIds } },
      _count: { _all: true },
    }),

  conversionStatsByLink: (linkIds: string[]) =>
    prisma.conversion.groupBy({
      by: ['linkId', 'type'],
      where: { linkId: { in: linkIds } },
      _count: { _all: true },
      _sum: { payout: true },
    }),
};
