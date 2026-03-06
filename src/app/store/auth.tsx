/**
 * Authentication Context - Manages current user session
 * Session persists via sessionStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserDB, initializeDatabase } from './db';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'qms_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      await initializeDatabase();
      try {
        const sessionData = sessionStorage.getItem(SESSION_KEY);
        if (sessionData) {
          const sessionUser = JSON.parse(sessionData);
          const freshUser = UserDB.getById(sessionUser.id);
          if (freshUser && freshUser.isActive) {
            setCurrentUser(freshUser);
          }
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
      setIsLoading(false);
    };
    bootstrap();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<User | null> => {
    await initializeDatabase();
    const user = UserDB.authenticate(username, password);
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id }));
    }
    return user;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Role guard hook
export function useRequireRole(roles: string[]) {
  const { currentUser } = useAuth();
  return currentUser && roles.includes(currentUser.role) ? currentUser : null;
}
