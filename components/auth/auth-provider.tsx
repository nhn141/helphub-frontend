import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  ApiError,
  getMyProfile,
  login as loginRequest,
  refreshToken,
  register as registerRequest,
  type AuthSession,
  type LoginPayload,
  type RegisterPayload,
  type UserProfile,
} from '@/components/auth/auth-api';
import {
  clearStoredAuthSession,
  getStoredAuthSession,
  setStoredAuthSession,
} from '@/components/auth/auth-storage';

type AuthContextValue = {
  session: AuthSession | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthSession | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function getUserWithFreshSession(session: AuthSession) {
  try {
    const user = await getMyProfile(session.accessToken);
    return { session, user };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }
  }

  const refreshedSession = await refreshToken(session.refreshToken);
  const user = await getMyProfile(refreshedSession.accessToken);

  return { session: refreshedSession, user };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function restoreSession() {
      const storedSession = await getStoredAuthSession();

      if (!storedSession) {
        if (isActive) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const freshAuth = await getUserWithFreshSession(storedSession);

        if (!isActive) {
          return;
        }

        setSession(freshAuth.session);
        setUser(freshAuth.user);
        await setStoredAuthSession(freshAuth.session);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await clearStoredAuthSession();

          if (isActive) {
            setSession(null);
            setUser(null);
          }
        } else if (isActive) {
          setSession(storedSession);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isActive = false;
    };
  }, []);

  const commitAuthSession = useCallback(async (nextSession: AuthSession) => {
    const profile = await getMyProfile(nextSession.accessToken);

    setSession(nextSession);
    setUser(profile);
    await setStoredAuthSession(nextSession);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const nextSession = await loginRequest(payload);
      await commitAuthSession(nextSession);
    },
    [commitAuthSession]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const nextSession = await registerRequest(payload);
      await commitAuthSession(nextSession);
    },
    [commitAuthSession]
  );

  const logout = useCallback(async () => {
    setSession(null);
    setUser(null);
    await clearStoredAuthSession();
  }, []);

  const refreshSession = useCallback(async () => {
    if (!session) {
      return null;
    }

    const freshAuth = await getUserWithFreshSession(session);

    setSession(freshAuth.session);
    setUser(freshAuth.user);
    await setStoredAuthSession(freshAuth.session);

    return freshAuth.session;
  }, [session]);

  const value = useMemo(
    () => ({
      session,
      user,
      isAuthenticated: Boolean(session),
      isLoading,
      login,
      register,
      logout,
      refreshSession,
    }),
    [session, user, isLoading, login, register, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
