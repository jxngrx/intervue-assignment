import { STORAGE_KEYS } from '../config/constants';
import { UserRole } from '../types/user';

// Generate a unique tab ID for session storage
const getTabId = (): string => {
  let tabId = sessionStorage.getItem('tab_id');
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('tab_id', tabId);
  }
  return tabId;
};

// Use sessionStorage with tab-specific keys for per-tab persistence
const getKey = (key: string): string => {
  return `${getTabId()}_${key}`;
};

export const storage = {
  getRole: (): UserRole | null => {
    const role = sessionStorage.getItem(getKey(STORAGE_KEYS.USER_ROLE));
    return role === 'teacher' || role === 'student' ? role : null;
  },

  setRole: (role: UserRole): void => {
    sessionStorage.setItem(getKey(STORAGE_KEYS.USER_ROLE), role);
  },

  getStudentId: (): string | null => {
    return sessionStorage.getItem(getKey(STORAGE_KEYS.STUDENT_ID));
  },

  setStudentId: (studentId: string): void => {
    sessionStorage.setItem(getKey(STORAGE_KEYS.STUDENT_ID), studentId);
  },

  getStudentName: (): string | null => {
    return sessionStorage.getItem(getKey(STORAGE_KEYS.STUDENT_NAME));
  },

  setStudentName: (name: string): void => {
    sessionStorage.setItem(getKey(STORAGE_KEYS.STUDENT_NAME), name);
  },

  clear: (): void => {
    const tabId = getTabId();
    Object.values(STORAGE_KEYS).forEach((key) => {
      sessionStorage.removeItem(`${tabId}_${key}`);
    });
  },

  generateStudentId: (): string => {
    return `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
};
