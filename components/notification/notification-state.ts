import { useSyncExternalStore } from 'react';

import type { ChatMessage, NotificationItem } from '@/components/chat/chat-api';

export type MessageNotificationMeta = {
  conversationId: string;
  senderId: string | null;
  senderName: string | null;
};

let unreadNotificationCount = 0;
let notifications: NotificationItem[] = [];
let messageNotificationMetaByMessageId: Record<string, MessageNotificationMeta> = {};
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

function getNotificationsSnapshot() {
  return notifications;
}

function getMessageNotificationMetaSnapshot() {
  return messageNotificationMetaByMessageId;
}

export function useUnreadNotificationCount() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useNotificationItems() {
  return useSyncExternalStore(subscribe, getNotificationsSnapshot, getNotificationsSnapshot);
}

export function useMessageNotificationMetaByMessageId() {
  return useSyncExternalStore(
    subscribe,
    getMessageNotificationMetaSnapshot,
    getMessageNotificationMetaSnapshot
  );
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

export function setNotificationItems(nextNotifications: NotificationItem[]) {
  notifications = [...nextNotifications];
  emitUnreadNotificationChange();
}

export function upsertNotificationItem(nextNotification: NotificationItem) {
  notifications = [
    nextNotification,
    ...notifications.filter((notification) => notification.id !== nextNotification.id),
  ];
  emitUnreadNotificationChange();
}

export function updateNotificationItems(updatedNotifications: Map<string, NotificationItem>) {
  if (updatedNotifications.size === 0) {
    return;
  }

  notifications = notifications.map(
    (notification) => updatedNotifications.get(notification.id) ?? notification
  );
  emitUnreadNotificationChange();
}

export function removeNotificationItems(notificationIds: Iterable<string>) {
  const ids = new Set(notificationIds);

  if (ids.size === 0) {
    return;
  }

  const nextNotifications = notifications.filter((notification) => !ids.has(notification.id));

  if (nextNotifications.length === notifications.length) {
    return;
  }

  notifications = nextNotifications;
  emitUnreadNotificationChange();
}

export function clearNotificationItems() {
  if (notifications.length === 0) {
    return;
  }

  notifications = [];
  emitUnreadNotificationChange();
}

export function upsertMessageNotificationMeta(message: ChatMessage) {
  messageNotificationMetaByMessageId = {
    ...messageNotificationMetaByMessageId,
    [message.id]: {
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.senderName,
    },
  };
  emitUnreadNotificationChange();
}

export function clearMessageNotificationMeta() {
  if (Object.keys(messageNotificationMetaByMessageId).length === 0) {
    return;
  }

  messageNotificationMetaByMessageId = {};
  emitUnreadNotificationChange();
}
