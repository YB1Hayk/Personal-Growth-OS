import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/http';
import { postbackAuth } from '../../shared/middleware/postback-auth';
import { trafficController } from './traffic.controller';

// /api/traffic/* — управление связками и постбек
const router = Router();

router.post('/links', asyncHandler(trafficController.createLink));
router.get('/links', asyncHandler(trafficController.getStats));
router.patch('/links/:id', asyncHandler(trafficController.updateLink));
router.delete('/links/:id', asyncHandler(trafficController.deleteLink));
router.get('/postback', postbackAuth, asyncHandler(trafficController.postback));

export const trafficRouter = router;

// /go/:slug — публичный редирект, монтируется в корень (не под /api)
const redirect = Router();
redirect.get('/:slug', asyncHandler(trafficController.redirect));
export const goRouter = redirect;
