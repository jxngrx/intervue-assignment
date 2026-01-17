// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

// API Endpoints
export const API_ENDPOINTS = {
  POLLS: {
    CREATE: '/api/polls',
    GET_ACTIVE: '/api/polls/active',
    GET_HISTORY: '/api/polls/history',
    ACTIVATE: (id: string) => `/api/polls/${id}/activate`,
    GET_RESULTS: (id: string) => `/api/polls/${id}/results`,
  },
  VOTES: {
    SUBMIT: '/api/votes',
  },
  STATE: {
    TEACHER: '/api/state/teacher',
    STUDENT: (studentId: string) => `/api/state/student/${studentId}`,
  },
  HEALTH: '/health',
} as const;

// LocalStorage Keys
export const STORAGE_KEYS = {
  USER_ROLE: 'poll_user_role',
  STUDENT_ID: 'poll_student_id',
  STUDENT_NAME: 'poll_student_name',
} as const;

// Poll Configuration
export const POLL_CONFIG = {
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 10,
  MIN_DURATION: 15,
  MAX_DURATION: 120,
  DEFAULT_DURATION: 60,
  DURATION_OPTIONS: [15, 30, 60, 120],
} as const;

// Timer Configuration
export const TIMER_CONFIG = {
  UPDATE_INTERVAL: 1000, // 1 second
} as const;
