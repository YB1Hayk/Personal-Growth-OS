import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/lib/prisma';

const router = Router();
const createSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(4000).optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
});
const updateSchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  description: z.string().trim().max(4000).optional().nullable(),
  status: z.enum(['OPEN', 'DONE']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).optional(),
  dueAt: z.string().datetime().optional().nullable(),
});

router.get('/', async (req, res, next) => {
  try {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    const status = req.query.status === 'OPEN' || req.query.status === 'DONE' ? req.query.status : undefined;
    const tasks = await prisma.task.findMany({
      where: { ...(projectId ? { projectId } : {}), ...(status ? { status } : {}) },
      include: { project: { select: { id: true, name: true, niche: true } } },
      orderBy: [{ status: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
      take: 300,
    });
    res.json({ success: true, data: tasks });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    const task = await prisma.task.create({ data: { ...input, dueAt: input.dueAt ? new Date(input.dueAt) : null } });
    res.status(201).json({ success: true, data: task });
  } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const input = updateSchema.parse(req.body);
    const task = await prisma.task.update({ where: { id: req.params.id }, data: { ...input, dueAt: input.dueAt === undefined ? undefined : input.dueAt ? new Date(input.dueAt) : null } });
    res.json({ success: true, data: task });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) { next(error); }
});

export { router as tasksRouter };
