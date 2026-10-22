import { Request, Response } from 'express'
import { outreachService } from './outreach.service'
import { sendTemplateSchema, createTemplateSchema } from './outreach.schema'
import { z } from 'zod'

export class OutreachController {
  // POST /api/outreach/send
  async send(req: Request, res: Response): Promise<void> {
    try {
      const { leadId, templateId } = sendTemplateSchema.parse({ body: req.body }).body
      await outreachService.sendTemplate(leadId, templateId)
      res.json({ data: { sent: true }, error: null, meta: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ data: null, error: { message: 'Ошибка валидации', code: 'VALIDATION_ERROR' }, meta: null })
        return
      }
      const msg = error instanceof Error ? error.message : 'Внутренняя ошибка'
      res.status(500).json({ data: null, error: { message: msg, code: 'INTERNAL_ERROR' }, meta: null })
    }
  }

  // GET /api/outreach/templates?projectId=...
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const projectId = req.query.projectId as string
      if (!projectId) {
        res.status(400).json({ data: null, error: { message: 'projectId обязателен', code: 'MISSING_PARAM' }, meta: null })
        return
      }
      const templates = await outreachService.getTemplates(projectId)
      res.json({ data: templates, error: null, meta: { count: templates.length } })
    } catch {
      res.status(500).json({ data: null, error: { message: 'Внутренняя ошибка', code: 'INTERNAL_ERROR' }, meta: null })
    }
  }

  // POST /api/outreach/templates
  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { name, content, projectId } = createTemplateSchema.parse({ body: req.body }).body
      const template = await outreachService.createTemplate({ name, content, projectId })
      res.status(201).json({ data: template, error: null, meta: null })
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ data: null, error: { message: 'Ошибка валидации', code: 'VALIDATION_ERROR' }, meta: null })
        return
      }
      res.status(500).json({ data: null, error: { message: 'Внутренняя ошибка', code: 'INTERNAL_ERROR' }, meta: null })
    }
  }

  // PATCH /api/outreach/templates/:id
  async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { name, content } = req.body as { name?: string; content?: string }
      const template = await outreachService.updateTemplate(req.params.id, { name, content })
      res.json({ data: template, error: null, meta: null })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Ошибка'
      const code = msg === 'Шаблон не найден' ? 404 : 500
      res.status(code).json({ data: null, error: { message: msg, code: 'UPDATE_ERROR' }, meta: null })
    }
  }

  // DELETE /api/outreach/templates/:id
  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      await outreachService.deleteTemplate(req.params.id)
      res.json({ data: { deleted: true }, error: null, meta: null })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Ошибка'
      res.status(404).json({ data: null, error: { message: msg, code: 'NOT_FOUND' }, meta: null })
    }
  }

  // GET /api/outreach/logs/:leadId
  async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const logs = await outreachService.getLogsByLead(req.params.leadId)
      res.json({ data: logs, error: null, meta: { count: logs.length } })
    } catch {
      res.status(500).json({ data: null, error: { message: 'Внутренняя ошибка', code: 'INTERNAL_ERROR' }, meta: null })
    }
  }

  // POST /api/outreach/generate-message
  async generateMessage(req: Request, res: Response): Promise<void> {
    try {
      const { leadId, projectId, insightId } = req.body
      const message = await outreachService.generateAIMessage({ leadId, projectId, insightId })
      res.json({ data: message, error: null, meta: null })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Ошибка генерации'
      res.status(500).json({ data: null, error: { message: msg, code: 'GENERATE_ERROR' }, meta: null })
    }
  }
}
