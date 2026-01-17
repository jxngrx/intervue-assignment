export interface PollOption {
  text: string;
  votes: number;
}

export interface Poll {
  _id: string;
  question: string;
  options: PollOption[];
  status: 'pending' | 'active' | 'completed';
  duration: number; // in seconds
  startTime?: string | Date;
  endTime?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface VoteCountOption {
  text: string;
  votes: number;
  percentage: number;
}

export interface VoteCounts {
  options: VoteCountOption[];
  totalVotes: number;
}

export interface PollWithResults extends Poll {
  results?: VoteCountOption[];
}

export interface CreatePollData {
  question: string;
  options: string[];
  duration: number;
}

export interface SubmitVoteData {
  pollId: string;
  studentId: string;
  optionIndex: number;
}
