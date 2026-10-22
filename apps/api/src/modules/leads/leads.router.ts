import { Router } from 'express';
import { LeadsController } from './leads.controller';

const router = Router();
const leadsController = new LeadsController();

router.post('/', leadsController.create);
router.get('/', leadsController.findAllByProject);
router.patch('/:id', leadsController.update);

export const leadsRouter = router;
