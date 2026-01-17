import mongoose from 'mongoose';
import Poll from '../models/Poll';
import { NotFoundError } from '../utils/errors';

export interface TimerState {
  remaining: number; // seconds remaining
  isActive: boolean;
  elapsed: number; // seconds elapsed
  totalDuration: number;
}

export class TimerService {
  /**
   * Get remaining time for a poll
   */
  async getRemainingTime(pollId: string): Promise<number> {
    const poll = await Poll.findById(pollId).exec();
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    if (!poll.startTime || poll.status !== 'active') {
      return 0;
    }

    const now = new Date();
    const elapsed = Math.floor((now.getTime() - poll.startTime.getTime()) / 1000);
    const remaining = Math.max(0, poll.duration - elapsed);

    return remaining;
  }

  /**
   * Check if poll is still active (within time limit)
   */
  async isPollActive(pollId: string): Promise<boolean> {
    const poll = await Poll.findById(pollId).exec();
    if (!poll) {
      return false;
    }

    if (poll.status !== 'active') {
      return false;
    }

    if (!poll.startTime) {
      return false;
    }

    const remaining = await this.getRemainingTime(pollId);
    return remaining > 0;
  }

  /**
   * Get complete timer state for a poll
   */
  async getTimerState(pollId: string): Promise<TimerState> {
    const poll = await Poll.findById(pollId).exec();
    if (!poll) {
      throw new NotFoundError('Poll not found');
    }

    if (!poll.startTime || poll.status !== 'active') {
      return {
        remaining: 0,
        isActive: false,
        elapsed: 0,
        totalDuration: poll.duration,
      };
    }

    const now = new Date();
    const elapsed = Math.floor((now.getTime() - poll.startTime.getTime()) / 1000);
    const remaining = Math.max(0, poll.duration - elapsed);
    const isActive = remaining > 0 && poll.status === 'active';

    return {
      remaining,
      isActive,
      elapsed,
      totalDuration: poll.duration,
    };
  }

  /**
   * Calculate remaining time for a student joining late
   * If student joins 10 seconds into a 60-second poll, returns 50
   */
  calculateRemainingTimeForLateJoin(
    startTime: Date,
    duration: number,
    currentTime: Date = new Date()
  ): number {
    const elapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
    return Math.max(0, duration - elapsed);
  }

  /**
   * Check and auto-complete expired polls
   */
  async checkAndCompleteExpiredPolls(): Promise<void> {
    // Check if mongoose is connected before running query
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }

    const activePolls = await Poll.find({ status: 'active' }).exec();
    const now = new Date();

    for (const poll of activePolls) {
      if (poll.endTime && now > poll.endTime) {
        poll.status = 'completed';
        await poll.save();
      }
    }
  }
}

export default new TimerService();
