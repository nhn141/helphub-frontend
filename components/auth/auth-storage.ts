import { Platform } from 'react-native';

import type { AuthSession } from '@/components/auth/auth-api';

const AUTH_STORAGE_KEY = 'helphub.auth.session';

let memorySession: AuthSession | null = null;

function getWebStorage() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export async function getStoredAuthSession() {
  const storage = getWebStorage();

  if (!storage) {
    return memorySession;
  }

  const rawSession = storage.getItem(AUTH_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    storage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export async function setStoredAuthSession(session: AuthSession) {
  memorySession = session;

  const storage = getWebStorage();

  if (storage) {
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
}

export async function clearStoredAuthSession() {
  memorySession = null;

  const storage = getWebStorage();

  if (storage) {
    storage.removeItem(AUTH_STORAGE_KEY);
  }
}
