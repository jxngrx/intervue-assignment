import PollService from './PollService';
import VoteService from './VoteService';
import TimerService from './TimerService';

export interface TeacherState {
  activePoll: any | null;
  voteCounts: any | null;
  timerState: any | null;
  canCreateNewPoll: boolean;
  reason?: string;
}

export interface StudentState {
  activePoll: any | null;
  hasVoted: boolean;
  timerState: any | null;
  voteCounts: any | null;
}

export class StateService {
  /**
   * Get complete state for teacher (for state recovery)
   */
  async getTeacherState(connectedStudentsCount?: number): Promise<TeacherState> {
    const activePoll = await PollService.getActivePoll();

    if (!activePoll) {
      // If no active poll, get the most recent completed poll to show results
      const history = await PollService.getPollHistory();
      const lastCompletedPoll = history.length > 0 ? history[0] : null;

      const canCreateInfo = await PollService.canCreateNewPoll(connectedStudentsCount);

      if (lastCompletedPoll) {
        // Return the last completed poll with its results
        const voteCounts = await VoteService.getVoteCounts(lastCompletedPoll.id);
        return {
          activePoll: {
            _id: lastCompletedPoll.id,
            question: lastCompletedPoll.question,
            options: lastCompletedPoll.options,
            status: lastCompletedPoll.status,
            duration: lastCompletedPoll.duration,
            startTime: lastCompletedPoll.startTime,
            endTime: lastCompletedPoll.endTime,
            createdAt: lastCompletedPoll.createdAt,
          },
          voteCounts,
          timerState: { remaining: 0, isActive: false, elapsed: lastCompletedPoll.duration, totalDuration: lastCompletedPoll.duration },
          canCreateNewPoll: canCreateInfo.canCreate,
          reason: canCreateInfo.reason,
        };
      }

      return {
        activePoll: null,
        voteCounts: null,
        timerState: null,
        canCreateNewPoll: canCreateInfo.canCreate,
        reason: canCreateInfo.reason,
      };
    }

    const voteCounts = await VoteService.getVoteCounts(activePoll.id);
    const timerState = await TimerService.getTimerState(activePoll.id);
    const canCreateInfo = await PollService.canCreateNewPoll(connectedStudentsCount);

    return {
      activePoll: {
        _id: activePoll.id,
        question: activePoll.question,
        options: activePoll.options,
        status: activePoll.status,
        duration: activePoll.duration,
        startTime: activePoll.startTime,
        endTime: activePoll.endTime,
        createdAt: activePoll.createdAt,
      },
      voteCounts,
      timerState,
      canCreateNewPoll: canCreateInfo.canCreate,
      reason: canCreateInfo.reason,
    };
  }

  /**
   * Get complete state for student (for state recovery)
   */
  async getStudentState(studentId: string): Promise<StudentState> {
    const activePoll = await PollService.getActivePoll();

    if (!activePoll) {
      return {
        activePoll: null,
        hasVoted: false,
        timerState: null,
        voteCounts: null,
      };
    }

    const hasVoted = await VoteService.hasStudentVoted(
      activePoll.id,
      studentId
    );
    const timerState = await TimerService.getTimerState(activePoll.id);
    const voteCounts = await VoteService.getVoteCounts(activePoll.id);

    return {
      activePoll: {
        _id: activePoll.id,
        question: activePoll.question,
        options: activePoll.options,
        status: activePoll.status,
        duration: activePoll.duration,
        startTime: activePoll.startTime,
        endTime: activePoll.endTime,
      },
      hasVoted,
      timerState,
      voteCounts,
    };
  }
}

export default new StateService();
