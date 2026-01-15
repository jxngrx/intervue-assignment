import { Request, Response, NextFunction } from 'express';
import VoteService from '../services/VoteService';

export class VoteController {
  /**
   * Submit a vote
   * POST /api/votes
   */
  async submitVote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pollId, studentId, optionIndex } = req.body;

      if (!pollId || !studentId || optionIndex === undefined) {
        res.status(400).json({
          status: 'error',
          message: 'pollId, studentId, and optionIndex are required',
        });
        return;
      }

      const vote = await VoteService.submitVote(pollId, studentId, optionIndex);
      const voteCounts = await VoteService.getVoteCounts(pollId);

      res.status(201).json({
        status: 'success',
        data: {
          vote,
          voteCounts,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new VoteController();
