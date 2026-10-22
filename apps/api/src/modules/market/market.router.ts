import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/http';
import { marketController } from './market.controller';
// Импортируем валидатор, если он есть в shared. Предположим, он там есть согласно правилам.
// Если нет, я создам его позже.
const router = Router();

router.post('/insights', asyncHandler(marketController.create));
router.get('/insights', asyncHandler(marketController.getAllByProject));
router.post('/scan', asyncHandler(marketController.scan));

export const marketRouter = router;
