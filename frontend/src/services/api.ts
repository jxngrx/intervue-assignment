import { API_BASE_URL, API_ENDPOINTS } from '../config/constants';
import { Poll, CreatePollData, SubmitVoteData, VoteCounts, PollWithResults } from '../types/poll';
import { TeacherState, StudentState } from '../types/user';

interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
}

interface ApiErrorType extends Error {
  status: number;
}

const createApiError = (status: number, message: string): ApiErrorType => {
  const error = new Error(message) as ApiErrorType;
  error.status = status;
  error.name = 'ApiError';
  return error;
};

const api = {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw createApiError(response.status, error.message || 'Request failed');
    }

    const data: ApiResponse<T> = await response.json();
    return data.data as T;
  },

  // Poll endpoints
  async createPoll(data: CreatePollData): Promise<Poll> {
    return this.request<Poll>(API_ENDPOINTS.POLLS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getActivePoll(): Promise<PollWithResults | null> {
    return this.request<PollWithResults | null>(API_ENDPOINTS.POLLS.GET_ACTIVE);
  },

  async getPollHistory(): Promise<PollWithResults[]> {
    return this.request<PollWithResults[]>(API_ENDPOINTS.POLLS.GET_HISTORY);
  },

  async activatePoll(pollId: string): Promise<Poll> {
    return this.request<Poll>(API_ENDPOINTS.POLLS.ACTIVATE(pollId), {
      method: 'POST',
    });
  },

  async getPollResults(pollId: string): Promise<PollWithResults> {
    return this.request<PollWithResults>(API_ENDPOINTS.POLLS.GET_RESULTS(pollId));
  },

  // Vote endpoints
  async submitVote(data: SubmitVoteData): Promise<{ vote: any; voteCounts: VoteCounts }> {
    return this.request<{ vote: any; voteCounts: VoteCounts }>(API_ENDPOINTS.VOTES.SUBMIT, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // State endpoints
  async getTeacherState(): Promise<TeacherState> {
    return this.request<TeacherState>(API_ENDPOINTS.STATE.TEACHER);
  },

  async getStudentState(studentId: string): Promise<StudentState> {
    return this.request<StudentState>(API_ENDPOINTS.STATE.STUDENT(studentId));
  },

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>(API_ENDPOINTS.HEALTH);
  },
};

export default api;
export type { ApiErrorType as ApiError };
