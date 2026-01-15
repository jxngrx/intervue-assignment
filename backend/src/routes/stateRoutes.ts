import { Router } from 'express';
import StateController from '../controllers/StateController';

const router = Router();

router.get('/teacher', StateController.getTeacherState.bind(StateController));
router.get('/student/:studentId', StateController.getStudentState.bind(StateController));

export default router;
