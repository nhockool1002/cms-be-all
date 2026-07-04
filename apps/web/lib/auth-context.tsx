'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AuthTokens, LoginRequest, RegisterRequest } from '@cms-be-all/shared';
import { apiFetch, clearTokens, getAccessToken, setTokens } from './api-client';

interface CurrentUser {
  id: string;
  username: string;
  roles: string[];
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  // Fixed initial value (not derived from localStorage) so server and client render
  // identically on first paint -- reading getAccessToken() here caused a hydration
  // mismatch, since it always returns null during SSR but may return a real token
  // on the client. The real check happens client-only, in the effect below.
  const [loading, setLoading] = useState<boolean>(true);

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    try {
      const me = await apiFetch<CurrentUser>('/auth/me', { auth: true });
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // loadUser only sets state after an `await` (the /auth/me fetch); the rule can't
    // see across that async boundary and flags this standard fetch-on-mount pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const tokens = await apiFetch<AuthTokens>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTokens(tokens.accessToken, tokens.refreshToken);
      await loadUser();
    },
    [loadUser],
  );

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const tokens = await apiFetch<AuthTokens>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTokens(tokens.accessToken, tokens.refreshToken);
      await loadUser();
    },
    [loadUser],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
