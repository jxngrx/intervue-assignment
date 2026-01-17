import { Poll, VoteCounts } from './poll';

export interface TimerState {
  remaining: number; // seconds remaining
  isActive: boolean;
  elapsed: number; // seconds elapsed
  totalDuration: number;
}

export interface ServerToClientEvents {
  'poll:created': (poll: Poll) => void;
  'poll:activated': (data: { poll: Poll; timerState: TimerState }) => void;
  'vote:received': (data: { voteCounts: VoteCounts; totalVotes: number }) => void;
  'poll:completed': (data: { poll: Poll; results: any }) => void;
  'poll:cancelled': (data: { pollId: string }) => void;
  'timer:update': (timerState: TimerState) => void;
  'state:sync': (state: any) => void;
  'participants:update': (participants: Array<{ studentId: string; name: string }>) => void;
  'chat:message': (data: { studentId: string; name: string; message: string; timestamp: Date }) => void;
  'student:kicked': () => void;
  'error': (error: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  'poll:create': (data: { question: string; options: string[]; duration: number }) => void;
  'poll:activate': (pollId: string) => void;
  'poll:cancel': (pollId: string) => void;
  'vote:submit': (data: { pollId: string; studentId: string; optionIndex: number }) => void;
  'state:request': (data: { type: 'teacher' | 'student'; studentId?: string }) => void;
  'student:join': (data: { studentId: string; name: string }) => void;
  'chat:send': (data: { studentId: string; name: string; message: string }) => void;
  'teacher:set': () => void;
  'teacher:logout': () => void;
  'student:kick': (data: { studentId: string }) => void;
  'participants:request': () => void;
}
