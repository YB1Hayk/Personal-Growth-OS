import { Request, Response } from 'express';
import { ProjectsService } from './projects.service';
import { createProjectSchema, updateProjectSchema } from './projects.schema';
import { z } from 'zod';

const projectsService = new ProjectsService();
function publicProject(project: Awaited<ReturnType<ProjectsService['createProject']>>) {
  const { tgBotToken, ...safe } = project;
  return { ...safe, hasTelegramToken: Boolean(tgBotToken) };
}

export class ProjectsController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createProjectSchema.parse({ body: req.body });
      const project = await projectsService.createProject(validatedData.body);
      
      res.status(201).json({ success: true, data: publicProject(project) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error.errors });
        return;
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const projects = await projectsService.getAllProjects();
      
      res.status(200).json({ success: true, data: projects.map(publicProject) });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = updateProjectSchema.parse({ body: req.body });
      const project = await projectsService.updateProject(id, validatedData.body);
      
      res.status(200).json({ success: true, data: publicProject(project) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error.errors });
        return;
      }
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
