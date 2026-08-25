import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '../types';

const STORAGE_KEY = 'powerup.auth';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  isLoading: boolean;
  login: (user: AuthUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({ user: null, token: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setState(JSON.parse(stored));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (user: AuthUser, token: string) => {
    const next = { user, token };
    setState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const logout = async () => {
    setState({ user: null, token: null });
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ ...state, isLoading, login, logout }),
    [state, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
