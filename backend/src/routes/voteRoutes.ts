import { Router } from 'express';
import VoteController from '../controllers/VoteController';

const router = Router();

router.post('/', VoteController.submitVote.bind(VoteController));

export default router;
