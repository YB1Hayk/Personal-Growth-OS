import { Lead } from '@prisma/client';
import { prisma } from '../../shared/lib/prisma';
import { CreateLeadInput } from './leads.schema';



export class LeadsRepository {
  async create(data: CreateLeadInput): Promise<Lead> {
    return prisma.lead.create({
      data: {
        name: data.name,
        handle: data.contact, // Смена contact -> handle
        source: data.source,
        status: data.status || "NEW",
        notes: data.note,      // Смена note -> notes
        projectId: data.projectId,
      },
    });
  }

  async update(id: string, data: Partial<CreateLeadInput>): Promise<Lead> {
    return prisma.lead.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.note,
        handle: data.contact,
      },
    });
  }

  async findAllByProject(projectId: string): Promise<Lead[]> {
    return prisma.lead.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
