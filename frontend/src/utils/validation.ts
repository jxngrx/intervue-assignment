import { POLL_CONFIG } from '../config/constants';

export const validation = {
  validateQuestion: (question: string): { valid: boolean; error?: string } => {
    const trimmed = question.trim();
    if (!trimmed) {
      return { valid: false, error: 'Question is required' };
    }
    if (trimmed.length < 5) {
      return { valid: false, error: 'Question must be at least 5 characters' };
    }
    if (trimmed.length > 200) {
      return { valid: false, error: 'Question must be less than 200 characters' };
    }
    return { valid: true };
  },

  validateOptions: (options: string[]): { valid: boolean; error?: string } => {
    const validOptions = options.filter((opt) => opt.trim().length > 0);

    if (validOptions.length < POLL_CONFIG.MIN_OPTIONS) {
      return {
        valid: false,
        error: `At least ${POLL_CONFIG.MIN_OPTIONS} options are required`,
      };
    }

    if (validOptions.length > POLL_CONFIG.MAX_OPTIONS) {
      return {
        valid: false,
        error: `Maximum ${POLL_CONFIG.MAX_OPTIONS} options allowed`,
      };
    }

    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map((opt) => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      return { valid: false, error: 'Duplicate options are not allowed' };
    }

    return { valid: true };
  },

  validateDuration: (duration: number): { valid: boolean; error?: string } => {
    if (duration < POLL_CONFIG.MIN_DURATION) {
      return {
        valid: false,
        error: `Duration must be at least ${POLL_CONFIG.MIN_DURATION} seconds`,
      };
    }
    if (duration > POLL_CONFIG.MAX_DURATION) {
      return {
        valid: false,
        error: `Duration must be at most ${POLL_CONFIG.MAX_DURATION} seconds`,
      };
    }
    return { valid: true };
  },

  validateName: (name: string): { valid: boolean; error?: string } => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { valid: false, error: 'Name is required' };
    }
    if (trimmed.length < 2) {
      return { valid: false, error: 'Name must be at least 2 characters' };
    }
    if (trimmed.length > 50) {
      return { valid: false, error: 'Name must be less than 50 characters' };
    }
    return { valid: true };
  },
};
