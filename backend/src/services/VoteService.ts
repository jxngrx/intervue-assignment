import Vote, { IVote } from '../models/Vote';
import Poll from '../models/Poll';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';

export class VoteService {
  /**
   * Submit a vote
   */
  async submitVote(
    pollId: string,
    studentId: string,
    optionIndex: number
  ): Promise<IVote> {
    if (!studentId || studentId.trim().length === 0) {
      throw new BadRequestError('Student ID is required');
    }

    // Check if poll exists and is active
    const poll = await Poll.findById(pollId).exec();
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    if (poll.status !== 'active') {
      throw new BadRequestError('Poll is not active');
    }

    // Check if poll time has expired
    if (poll.endTime && new Date() > poll.endTime) {
      throw new BadRequestError('Poll time has expired');
    }

    // Validate option index
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      throw new BadRequestError('Invalid option index');
    }

    // Check if student has already voted
    const existingVote = await Vote.findOne({
      pollId: poll.id,
      studentId: studentId.trim(),
    }).exec();

    if (existingVote) {
      throw new ConflictError('Student has already voted for this poll');
    }

    // Create vote
    const vote = new Vote({
      pollId: poll.id,
      studentId: studentId.trim(),
      optionIndex,
    });

    try {
      const savedVote = await vote.save();

      // Update poll option vote count
      poll.options[optionIndex].votes += 1;
      await poll.save();

      return savedVote;
    } catch (error: any) {
      // Handle duplicate key error (race condition)
      if (error.code === 11000) {
        throw new ConflictError('Student has already voted for this poll');
      }
      throw error;
    }
  }

  /**
   * Check if a student has already voted
   */
  async hasStudentVoted(pollId: string, studentId: string): Promise<boolean> {
    const vote = await Vote.findOne({
      pollId,
      studentId: studentId.trim(),
    }).exec();

    return !!vote;
  }

  /**
   * Get all votes for a poll
   */
  async getAllVotesForPoll(pollId: string): Promise<IVote[]> {
    return await Vote.find({ pollId }).exec();
  }

  /**
   * Get vote counts and percentages for a poll
   */
  async getVoteCounts(pollId: string): Promise<{
    options: Array<{
      text: string;
      votes: number;
      percentage: number;
    }>;
    totalVotes: number;
  }> {
    const poll = await Poll.findById(pollId).exec();
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    const votes = await this.getAllVotesForPoll(pollId);

    // Aggregate vote counts
    const voteCounts = new Map<number, number>();
    votes.forEach((vote) => {
      const current = voteCounts.get(vote.optionIndex) || 0;
      voteCounts.set(vote.optionIndex, current + 1);
    });

    const totalVotes = votes.length;
    const options = poll.options.map((option, index) => ({
      text: option.text,
      votes: voteCounts.get(index) || 0,
      percentage: totalVotes > 0 ? ((voteCounts.get(index) || 0) / totalVotes) * 100 : 0,
    }));

    return {
      options,
      totalVotes,
    };
  }
}

export default new VoteService();
