export interface ServerToClientEvents {
  'poll:created': (poll: any) => void;
  'poll:activated': (data: { poll: any; timerState: any }) => void;
  'vote:received': (data: { voteCounts: any; totalVotes: number }) => void;
  'poll:completed': (data: { poll: any; results: any }) => void;
  'timer:update': (timerState: any) => void;
  'state:sync': (state: any) => void;
  'error': (error: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  'poll:create': (data: { question: string; options: string[]; duration: number }) => void;
  'poll:activate': (pollId: string) => void;
  'vote:submit': (data: { pollId: string; studentId: string; optionIndex: number }) => void;
  'state:request': (data: { type: 'teacher' | 'student'; studentId?: string }) => void;
  'student:join': (data: { studentId: string; name: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  studentId?: string;
  role?: 'teacher' | 'student';
}
