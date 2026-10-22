import { Router } from 'express';
import { aiController } from './ai.controller';

const router = Router();

router.post('/chat', aiController.chat);
router.post('/extract-insight', aiController.extractInsight);

export { router as aiRouter };
