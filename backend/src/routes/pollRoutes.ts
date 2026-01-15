import { Router } from 'express';
import PollController from '../controllers/PollController';

const router = Router();

router.post('/', PollController.createPoll.bind(PollController));
router.get('/active', PollController.getActivePoll.bind(PollController));
router.get('/history', PollController.getPollHistory.bind(PollController));
router.post('/:id/activate', PollController.activatePoll.bind(PollController));
router.get('/:id/results', PollController.getResults.bind(PollController));

export default router;
