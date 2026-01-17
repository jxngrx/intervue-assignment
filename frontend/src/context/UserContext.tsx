import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '../types/user';
import { storage } from '../utils/storage';

interface UserContextType {
  role: UserRole | null;
  studentId: string | null;
  studentName: string | null;
  setRole: (role: UserRole) => void;
  setStudent: (id: string, name: string) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state synchronously from sessionStorage to avoid timing issues
  const [role, setRoleState] = useState<UserRole | null>(() => {
    try {
      return storage.getRole();
    } catch {
      return null;
    }
  });
  const [studentId, setStudentIdState] = useState<string | null>(() => {
    try {
      return storage.getStudentId();
    } catch {
      return null;
    }
  });
  const [studentName, setStudentNameState] = useState<string | null>(() => {
    try {
      return storage.getStudentName();
    } catch {
      return null;
    }
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    storage.setRole(newRole);
  };

  const setStudent = (id: string, name: string) => {
    setStudentIdState(id);
    setStudentNameState(name);
    storage.setStudentId(id);
    storage.setStudentName(name);
  };

  const clearUser = () => {
    setRoleState(null);
    setStudentIdState(null);
    setStudentNameState(null);
    storage.clear();
  };

  return (
    <UserContext.Provider
      value={{
        role,
        studentId,
        studentName,
        setRole,
        setStudent,
        clearUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
