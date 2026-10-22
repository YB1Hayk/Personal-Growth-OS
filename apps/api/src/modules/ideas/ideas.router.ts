import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/lib/prisma';

const router = Router();
const createSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
  context: z.string().trim().max(4000).optional().nullable(),
});
const updateSchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  context: z.string().trim().max(4000).optional().nullable(),
  expectedImpact: z.string().trim().max(1000).optional().nullable(),
  effort: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().nullable(),
  confidence: z.number().int().min(1).max(5).optional(),
  status: z.enum(['INBOX', 'CONSIDERING', 'ACCEPTED', 'PARKED']).optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    const status = req.query.status === 'PARKED' ? 'PARKED' : undefined;
    const ideas = await prisma.idea.findMany({
      where: { ...(projectId ? { projectId } : {}), ...(status ? { status } : { status: { in: ['INBOX', 'CONSIDERING'] } }) },
      include: { project: { select: { id: true, name: true, niche: true } } },
      orderBy: { createdAt: 'desc' }, take: 200,
    });
    res.json({ success: true, data: ideas });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    const idea = await prisma.idea.create({ data: input });
    res.status(201).json({ success: true, data: idea });
  } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const input = updateSchema.parse(req.body);
    const idea = await prisma.idea.update({ where: { id: req.params.id }, data: input });
    res.json({ success: true, data: idea });
  } catch (error) { next(error); }
});

router.post('/:id/convert', async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const idea = await tx.idea.findUniqueOrThrow({ where: { id: req.params.id } });
      const task = await tx.task.create({ data: { projectId: idea.projectId, title: idea.title, description: idea.context } });
      const updatedIdea = await tx.idea.update({ where: { id: idea.id }, data: { status: 'ACCEPTED' } });
      return { task, idea: updatedIdea };
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.idea.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { next(error); }
});

export { router as ideasRouter };
