import { Router } from 'express';
import { ContentController } from './content.controller';

const router = Router();
const contentController = new ContentController();

router.post('/project/:id/plan', contentController.generatePlan.bind(contentController));
router.get('/project/:id', contentController.getProjectPosts.bind(contentController));
router.post('/generate-post', contentController.generatePost.bind(contentController));
router.patch('/:id/approve', contentController.approvePost.bind(contentController));
router.patch('/:id', contentController.updatePost.bind(contentController));
router.delete('/:id', contentController.deletePost.bind(contentController));
router.delete('/project/:id/clear', contentController.clearQueue.bind(contentController));

export const contentRouter = router;