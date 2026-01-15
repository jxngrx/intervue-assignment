import Poll, { IPoll } from '../models/Poll';
import Vote from '../models/Vote';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class PollService {
  /**
   * Create a new poll
   */
  async createPoll(
    question: string,
    options: string[],
    duration: number
  ): Promise<IPoll> {
    if (!question || question.trim().length === 0) {
      throw new BadRequestError('Question is required');
    }

    if (!options || options.length < 2) {
      throw new BadRequestError('Poll must have at least 2 options');
    }

    if (duration < 1 || duration > 60) {
      throw new BadRequestError('Duration must be between 1 and 60 seconds');
    }

    const pollOptions = options.map((text) => ({
      text: text.trim(),
      votes: 0,
    }));

    const poll = new Poll({
      question: question.trim(),
      options: pollOptions,
      duration,
      status: 'pending',
    });

    return await (poll as any).save();
  }

  /**
   * Get the currently active poll
   */
  async getActivePoll(): Promise<IPoll | null> {
    return await Poll.findOne({ status: 'active' }).exec();
  }

  /**
   * Get poll by ID
   */
  async getPollById(pollId: string): Promise<IPoll> {
    const poll = await Poll.findById(pollId).exec();
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }
    return poll;
  }

  /**
   * Activate a poll (start the timer)
   */
  async activatePoll(pollId: string): Promise<IPoll> {
    const poll = await this.getPollById(pollId);

    if (poll.status === 'active') {
      throw new BadRequestError('Poll is already active');
    }

    if (poll.status === 'completed') {
      throw new BadRequestError('Cannot activate a completed poll');
    }

    // Check if there's already an active poll
    const activePoll = await this.getActivePoll();
    if (activePoll && activePoll.id !== pollId) {
      throw new BadRequestError('Another poll is already active');
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + poll.duration * 1000);

    poll.status = 'active';
    poll.startTime = now;
    poll.endTime = endTime;

    return await (poll as any).save();
  }

  /**
   * Get poll history (all completed polls)
   */
  async getPollHistory(): Promise<IPoll[]> {
    return await Poll.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Check if a new poll can be created
   * Rules: No active poll OR all students have voted
   */
  async canCreateNewPoll(): Promise<{ canCreate: boolean; reason?: string }> {
    const activePoll = await this.getActivePoll();

    if (!activePoll) {
      return { canCreate: true };
    }

    // Check if poll time has expired
    if (activePoll.endTime && new Date() > activePoll.endTime) {
      // Auto-complete expired polls
      activePoll.status = 'completed';
      await (activePoll as any).save();
      return { canCreate: true };
    }

    return {
      canCreate: false,
      reason: 'An active poll exists. Please wait for it to complete or ensure all students have voted.',
    };
  }

  /**
   * Complete a poll (mark as completed)
   */
  async completePoll(pollId: string): Promise<IPoll> {
    const poll = await this.getPollById(pollId);
    poll.status = 'completed';
    return await (poll as any).save();
  }

  /**
   * Get poll with vote counts aggregated
   */
  async getPollWithResults(pollId: string): Promise<IPoll & { results: any }> {
    const poll = await this.getPollById(pollId);
    const votes = await Vote.find({ pollId: poll.id }).exec();

    // Aggregate vote counts
    const voteCounts = new Map<number, number>();
    votes.forEach((vote: any) => {
      const current = voteCounts.get(vote.optionIndex) || 0;
      voteCounts.set(vote.optionIndex, current + 1);
    });

    // Update poll options with vote counts
    const optionsWithVotes = poll.options.map((option, index) => ({
      text: option.text,
      votes: voteCounts.get(index) || 0,
    }));

    const totalVotes = votes.length;
    const results = optionsWithVotes.map((option) => ({
      text: option.text,
      votes: option.votes,
      percentage: totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0,
    }));

    return {
      ...poll,
      options: optionsWithVotes,
      results,
    } as IPoll & { results: any };
  }
}

export default new PollService();
