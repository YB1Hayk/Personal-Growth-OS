import { Router } from 'express';
import { publishPost } from './publication.service';
import { asyncHandler } from './shared/middleware/http';

const router = Router();
router.post('/:id/publish', asyncHandler(async (req, res) => {
  const data = await publishPost(req.params.id);
  res.json({ success: true, data, error: null, meta: null });
}));
export const publishRouter = router;
