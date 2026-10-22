import { Router } from 'express';
import { ProjectsController } from './projects.controller';

const router = Router();
const controller = new ProjectsController();

router.post('/', (req, res) => controller.create(req, res));
router.get('/', (req, res) => controller.findAll(req, res));
router.patch('/:id', (req, res) => controller.update(req, res));

export { router as projectsRouter };
