import { Request, Response, NextFunction } from 'express';
import StateService from '../services/StateService';
import { BadRequestError } from '../utils/errors';

export class StateController {
  /**
   * Get teacher state (for state recovery)
   * GET /api/state/teacher
   */
  async getTeacherState(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const state = await StateService.getTeacherState();

      res.status(200).json({
        status: 'success',
        data: state,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student state (for state recovery)
   * GET /api/state/student/:studentId
   */
  async getStudentState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params;

      if (!studentId) {
        throw new BadRequestError('Student ID is required');
      }

      const state = await StateService.getStudentState(studentId);

      res.status(200).json({
        status: 'success',
        data: state,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new StateController();
