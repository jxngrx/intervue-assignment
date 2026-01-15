import { Request, Response, NextFunction } from 'express';
import PollService from '../services/PollService';
import { BadRequestError } from '../utils/errors';

export class PollController {
  /**
   * Create a new poll
   * POST /api/polls
   */
  async createPoll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { question, options, duration } = req.body;

      if (!question || !options || !duration) {
        throw new BadRequestError('Question, options, and duration are required');
      }

      // Check if new poll can be created
      const canCreate = await PollService.canCreateNewPoll();
      if (!canCreate.canCreate) {
        throw new BadRequestError(canCreate.reason || 'Cannot create new poll at this time');
      }

      const poll = await PollService.createPoll(question, options, duration);

      res.status(201).json({
        status: 'success',
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active poll
   * GET /api/polls/active
   */
  async getActivePoll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const poll = await PollService.getActivePoll();

      if (!poll) {
        res.status(200).json({
          status: 'success',
          data: null,
        });
        return;
      }

      const pollWithResults = await PollService.getPollWithResults(poll.id);

      res.status(200).json({
        status: 'success',
        data: pollWithResults,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get poll history
   * GET /api/polls/history
   */
  async getPollHistory(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const polls = await PollService.getPollHistory();

      // Get results for each poll
      const pollsWithResults = await Promise.all(
        polls.map(async (poll) => {
          return await PollService.getPollWithResults(poll.id);
        })
      );

      res.status(200).json({
        status: 'success',
        data: pollsWithResults,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate a poll
   * POST /api/polls/:id/activate
   */
  async activatePoll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const poll = await PollService.activatePoll(id);

      res.status(200).json({
        status: 'success',
        data: poll,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get poll results
   * GET /api/polls/:id/results
   */
  async getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const pollWithResults = await PollService.getPollWithResults(id);

      res.status(200).json({
        status: 'success',
        data: pollWithResults,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PollController();
