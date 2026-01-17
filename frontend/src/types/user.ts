import { Poll, VoteCounts } from './poll';
import { TimerState } from './socket';

export type UserRole = 'teacher' | 'student';

export interface User {
  role: UserRole;
  studentId?: string;
  name?: string;
}

export interface StudentState {
  activePoll: Poll | null;
  hasVoted: boolean;
  timerState: TimerState | null;
  voteCounts: VoteCounts | null;
}

export interface TeacherState {
  activePoll: Poll | null;
  voteCounts: VoteCounts | null;
  timerState: TimerState | null;
  canCreateNewPoll: boolean;
  reason?: string;
}
