import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setToken, setUnauthorizedHandler } from '../api/client';
import type { LoginResponse, Role } from '../api/types';

interface AuthState {
  role: Role | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** The token is kept in memory by the API client; this context only knows the role. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);

  const logout = useCallback(() => {
    setToken(null);
    setRole(null);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', { username, password });
    setToken(response.access_token);
    setRole(response.role);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const value = useMemo(() => ({ role, login, logout }), [role, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
