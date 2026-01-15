import { Router } from 'express';
import pollRoutes from './pollRoutes';
import voteRoutes from './voteRoutes';
import stateRoutes from './stateRoutes';

const router = Router();

router.use('/polls', pollRoutes);
router.use('/votes', voteRoutes);
router.use('/state', stateRoutes);

export default router;
