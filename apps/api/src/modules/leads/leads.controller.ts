import { Request, Response } from 'express';
import { LeadsService } from './leads.service';
import { createLeadSchema, updateLeadSchema } from './leads.schema';
import { z } from 'zod';

const leadsService = new LeadsService();

export class LeadsController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createLeadSchema.parse({ body: req.body });
      const lead = await leadsService.createLead(validatedData.body);
      
      res.status(201).json({ data: lead, error: null, meta: null });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          data: null, 
          error: { message: 'Ошибка валидации', code: 'VALIDATION_ERROR', details: error.errors }, 
          meta: null 
        });
        return;
      }
      res.status(500).json({ 
        data: null, 
        error: { message: 'Внутренняя ошибка сервера', code: 'INTERNAL_ERROR' }, 
        meta: null 
      });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = updateLeadSchema.parse({ body: req.body });
      const lead = await leadsService.updateLead(id, validatedData.body);
      
      res.status(200).json({ data: lead, error: null, meta: null });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          data: null, 
          error: { message: 'Ошибка валидации', code: 'VALIDATION_ERROR', details: error.errors }, 
          meta: null 
        });
        return;
      }
      res.status(500).json({ 
        data: null, 
        error: { message: 'Внутренняя ошибка сервера', code: 'INTERNAL_ERROR' }, 
        meta: null 
      });
    }
  }

  async findAllByProject(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.query.projectId as string;
      if (!projectId) {
        res.status(400).json({ 
          data: null, 
          error: { message: 'projectId is required', code: 'MISSING_PARAM' }, 
          meta: null 
        });
        return;
      }
      const leads = await leadsService.getLeadsByProject(projectId);
      res.status(200).json({ data: leads, error: null, meta: { count: leads.length } });
    } catch (error) {
      res.status(500).json({ 
        data: null, 
        error: { message: 'Внутренняя ошибка сервера', code: 'INTERNAL_ERROR' }, 
        meta: null 
      });
    }
  }
}
