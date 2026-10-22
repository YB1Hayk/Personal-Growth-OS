import { Router } from 'express'
import { OutreachController } from './outreach.controller'

const router = Router()
const outreachController = new OutreachController()

router.post('/send', outreachController.send.bind(outreachController))
router.get('/templates', outreachController.getTemplates.bind(outreachController))
router.post('/templates', outreachController.createTemplate.bind(outreachController))
router.patch('/templates/:id', outreachController.updateTemplate.bind(outreachController))
router.delete('/templates/:id', outreachController.deleteTemplate.bind(outreachController))
router.get('/logs/:leadId', outreachController.getLogs.bind(outreachController))
router.post('/generate-message', outreachController.generateMessage.bind(outreachController))

export const outreachRouter = router
