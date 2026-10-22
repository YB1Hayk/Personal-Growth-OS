import { prisma } from '../../shared/lib/prisma';
import { CreateProjectInput, UpdateProjectInput } from './projects.schema';

export interface Project {
  id: string;
  name: string;
  niche: string;
  description?: string | null;
  currentFocus?: string | null;
  targetAudience?: string | null;
  dna?: string | null;
  brandVoice?: string | null;
  sourceUrl?: string | null;
  tgBotToken?: string | null;
  tgChatId?: string | null;
  planGenerationDay?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProjectsRepository {
  async create(data: CreateProjectInput): Promise<Project> {
    return prisma.project.create({
      data: {
        name: data.name,
        niche: data.niche,
        description: data.description,
        currentFocus: data.currentFocus,
        targetAudience: data.targetAudience,
        dna: data.dna,
        brandVoice: data.brandVoice,
        sourceUrl: data.sourceUrl,
        tgBotToken: data.tgBotToken,
        tgChatId: data.tgChatId,
        planGenerationDay: data.planGenerationDay,
      },
    });
  }

  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data: { ...data, tgBotToken: data.tgBotToken?.trim() || undefined },
    });
  }

  async findAll(): Promise<Project[]> {
    return prisma.project.findMany({
      orderBy: { createdAt: 'desc' }, 
    });
  }

  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
    });
  }
}
