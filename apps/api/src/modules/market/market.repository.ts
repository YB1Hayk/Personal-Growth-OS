import { prisma } from '../../shared/lib/prisma';
import { CreateInsightDto, MarketInsight } from './market.types';

export const marketRepository = {
  createInsight: (data: CreateInsightDto): Promise<MarketInsight> => 
    prisma.marketInsight.create({ data }),

  findByProject: (projectId: string): Promise<MarketInsight[]> =>
    prisma.marketInsight.findMany({ 
      where: { projectId }, 
      orderBy: { createdAt: 'desc' } 
    }),

  deleteInsight: (id: string): Promise<MarketInsight> =>
    prisma.marketInsight.delete({ where: { id } }),
};
