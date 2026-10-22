import { prisma } from '../../shared/lib/prisma'
import { CreateTemplateDto } from './outreach.types'

export const outreachRepository = {
  findTemplateById: (id: string) =>
    prisma.outreachTemplate.findUnique({ where: { id } }),

  findTemplatesByProject: (projectId: string) =>
    prisma.outreachTemplate.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    }),

  createTemplate: (data: CreateTemplateDto) =>
    prisma.outreachTemplate.create({ data }),

  deleteTemplate: (id: string) =>
    prisma.outreachTemplate.delete({ where: { id } }),

  updateTemplate: (id: string, data: { name?: string; content?: string }) =>
    prisma.outreachTemplate.update({ where: { id }, data }),


  logMessage: (leadId: string, templateId: string, message: string, status: 'SENT' | 'FAILED') =>
    prisma.outreachLog.create({
      data: { leadId, templateId, message, status },
    }),

  findLogsByLead: (leadId: string) =>
    prisma.outreachLog.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
}
