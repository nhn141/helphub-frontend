import { useSyncExternalStore } from 'react';

let unreadNotificationCount = 0;
const listeners = new Set<() => void>();

function emitUnreadNotificationChange() {
  listeners.forEach((listener) => listener());
}

function normalizeCount(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return unreadNotificationCount;
}

export function useUnreadNotificationCount() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setUnreadNotificationCount(nextCount: number) {
  const normalizedCount = normalizeCount(nextCount);

  if (normalizedCount === unreadNotificationCount) {
    return;
  }

  unreadNotificationCount = normalizedCount;
  emitUnreadNotificationChange();
}

export function decrementUnreadNotificationCount(amount = 1) {
  setUnreadNotificationCount(unreadNotificationCount - normalizeCount(amount));
}
