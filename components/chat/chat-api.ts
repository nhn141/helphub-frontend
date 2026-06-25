import { apiRequest, type ApiEnvelope } from '@/components/auth/auth-api';
import { chatRealtimeClient, type StompFrame } from '@/components/chat/realtime-client';

export type ConversationType = 'PRIVATE' | 'GROUP';

export type ConversationMember = {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  joinedAt: string;
};

export type ConversationSummary = {
  id: string;
  type: ConversationType;
  createdBy: string;
  members: ConversationMember[];
  lastMessageId: string | null;
  unreadCount: number;
  createdAt: string;
};

export type ConversationDetail = ConversationSummary & {
  myLastReadMessageId: string | null;
  updatedAt: string | null;
};

export type MessageMedia = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  altText: string | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  content: string | null;
  media: MessageMedia[];
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
};

export type NotificationItem = {
  id: string;
  content: string | null;
  referenceType: string | null;
  referenceId: string | null;
  actionUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type UnreadNotificationCount = {
  unreadCount: number;
};

export type RealtimeMessagePayload = {
  eventType: string;
  message: ChatMessage;
};

export type RealtimeNotificationPayload = {
  eventType: string;
  notification: NotificationItem;
  unreadCount: number;
};

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected';

export type SharedItemType = 'SUPPORT' | 'REQUEST' | 'LOCATION' | 'FUND';

export type SharedItem = {
  id: string;
  label: string;
  title: string;
  type: SharedItemType;
};

type RealtimeHandlers = {
  onMessage?: (payload: RealtimeMessagePayload) => void;
  onNotification?: (payload: RealtimeNotificationPayload) => void;
  onStatusChange?: (status: RealtimeStatus) => void;
  onError?: (message: string) => void;
};

type RealtimeSubscriptionOptions = {
  messages?: boolean;
  notifications?: boolean;
};

export async function getMyConversations(accessToken: string) {
  const response = await apiRequest<ApiEnvelope<ConversationSummary[]>>('/conversations/me', {
    accessToken,
    method: 'GET',
  });

  return response.data;
}

export async function createPrivateConversationByEmail(accessToken: string, receiverEmail: string) {
  const response = await apiRequest<ApiEnvelope<ConversationDetail>>(
    '/conversations/private/by-email',
    {
      accessToken,
      body: JSON.stringify({ receiverEmail }),
      method: 'POST',
    }
  );

  return response.data;
}

export async function getConversationById(accessToken: string, conversationId: string) {
  const response = await apiRequest<ApiEnvelope<ConversationDetail>>(
    `/conversations/${conversationId}`,
    {
      accessToken,
      method: 'GET',
    }
  );

  return response.data;
}

export async function getConversationMessages(accessToken: string, conversationId: string) {
  const response = await apiRequest<ApiEnvelope<ChatMessage[]>>(
    `/conversations/${conversationId}/messages`,
    {
      accessToken,
      method: 'GET',
    }
  );

  return response.data;
}

export async function sendConversationMessage(
  accessToken: string,
  conversationId: string,
  content: string | null,
  mediaIds: string[] = []
) {
  const normalizedContent = content?.trim() ?? '';
  const response = await apiRequest<ApiEnvelope<ChatMessage>>(
    `/conversations/${conversationId}/messages`,
    {
      accessToken,
      body: JSON.stringify({
        content: normalizedContent.length > 0 ? normalizedContent : null,
        mediaIds,
      }),
      method: 'POST',
    }
  );

  return response.data;
}

export async function markMessageAsRead(
  accessToken: string,
  conversationId: string,
  messageId: string
) {
  await apiRequest<ApiEnvelope<null>>(
    `/conversations/${conversationId}/messages/${messageId}/read`,
    {
      accessToken,
      method: 'PATCH',
    }
  );
}

export async function getMyNotifications(accessToken: string) {
  const response = await apiRequest<ApiEnvelope<NotificationItem[]>>('/notifications', {
    accessToken,
    method: 'GET',
  });

  return response.data;
}

export async function getUnreadNotificationCount(accessToken: string) {
  const response = await apiRequest<ApiEnvelope<UnreadNotificationCount>>(
    '/notifications/unread-count',
    {
      accessToken,
      method: 'GET',
    }
  );

  return response.data;
}

export async function markNotificationAsRead(accessToken: string, notificationId: string) {
  const response = await apiRequest<ApiEnvelope<NotificationItem>>(
    `/notifications/${notificationId}/read`,
    {
      accessToken,
      method: 'PATCH',
    }
  );

  return response.data;
}

export async function markAllNotificationsAsRead(accessToken: string) {
  await apiRequest<ApiEnvelope<null>>('/notifications/read-all', {
    accessToken,
    method: 'PATCH',
  });
}

export function getConversationTitle(conversation: ConversationSummary, currentUserId?: string | null) {
  const otherMembers = conversation.members.filter((member) => member.userId !== currentUserId);

  if (conversation.type === 'PRIVATE') {
    return otherMembers[0]?.fullName ?? conversation.members[0]?.fullName ?? 'Private chat';
  }

  const names = otherMembers.map((member) => member.fullName).filter(Boolean);
  return names.length > 0 ? names.join(', ') : 'Group chat';
}

export function getConversationSubtitle(
  conversation: ConversationSummary,
  currentUserId?: string | null
) {
  const otherMembers = conversation.members.filter((member) => member.userId !== currentUserId);

  if (conversation.type === 'PRIVATE') {
    return otherMembers[0]?.email ?? 'Direct conversation';
  }

  return `${conversation.members.length} members`;
}

export function getInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return 'HH';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function formatChatDateTime(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');

  return `${day}/${month} ${hours}:${minutes}`;
}

export function getSharedItemLabel(type: SharedItemType) {
  switch (type) {
    case 'FUND':
      return 'community fund';
    case 'LOCATION':
      return 'location hub';
    case 'REQUEST':
    case 'SUPPORT':
      return 'support request';
    default:
      return 'shared item';
  }
}

export function buildSharedItemMessage(type: SharedItemType, id: string, title: string) {
  const normalizedType = type === 'REQUEST' ? 'SUPPORT' : type;
  const normalizedTitle =
    title
      .replace(/[\r\n:[\]]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || getSharedItemLabel(normalizedType);

  return `[SHARED_ITEM:${normalizedType}:${id}:${normalizedTitle}]`;
}

export function parseSharedItemMessage(content: string | null | undefined): SharedItem | null {
  const match = content?.trim().match(/^\[SHARED_ITEM:([^:\]]+):([^:\]]+):(.*)\]$/);

  if (!match) {
    return null;
  }

  const rawType = match[1].toUpperCase();

  if (!['SUPPORT', 'REQUEST', 'LOCATION', 'FUND'].includes(rawType)) {
    return null;
  }

  const type = rawType as SharedItemType;
  const label = getSharedItemLabel(type);

  return {
    id: match[2],
    label,
    title: match[3].trim() || label,
    type,
  };
}

export function getSharedItemPreview(content: string | null | undefined) {
  const sharedItem = parseSharedItemMessage(content);

  return sharedItem ? `Shared a ${sharedItem.label}` : null;
}

export function extractConversationId(actionUrl: string | null | undefined) {
  const match = actionUrl?.match(/\/conversations\/([0-9a-f-]{36})/i);
  return match?.[1] ?? null;
}

export function extractSupportRequestId(actionUrl: string | null | undefined) {
  const match = actionUrl?.match(/\/support-requests\/([0-9a-f-]{36})/i);
  return match?.[1] ?? null;
}

export function extractReportId(actionUrl: string | null | undefined) {
  const match = actionUrl?.match(/\/reports\/([0-9a-f-]{36})/i);
  return match?.[1] ?? null;
}

export function connectChatRealtime(
  accessToken: string,
  handlers: RealtimeHandlers,
  subscriptions: RealtimeSubscriptionOptions = {}
) {
  let disposed = false;
  const activeSubscriptions: string[] = [];
  const shouldSubscribeMessages = subscriptions.messages ?? true;
  const shouldSubscribeNotifications = subscriptions.notifications ?? true;
  const statusListenerId = chatRealtimeClient.addStatusListener((status) => {
    if (!disposed) {
      handlers.onStatusChange?.(status);
    }
  });
  const errorListenerId = chatRealtimeClient.addErrorListener((message) => {
    if (!disposed) {
      handlers.onError?.(message);
    }
  });

  if (shouldSubscribeMessages) {
    activeSubscriptions.push(
      chatRealtimeClient.subscribe('/user/queue/messages', (message) => {
        handleRealtimeMessage(message, handlers, 'messages');
      })
    );
  }

  if (shouldSubscribeNotifications) {
    activeSubscriptions.push(
      chatRealtimeClient.subscribe('/user/queue/notifications', (message) => {
        handleRealtimeMessage(message, handlers, 'notifications');
      })
    );
  }

  handlers.onStatusChange?.('connecting');

  try {
    chatRealtimeClient.connect(accessToken);
  } catch (error) {
    handlers.onStatusChange?.('disconnected');
    handlers.onError?.(
      error instanceof Error ? error.message : 'Could not open realtime connection.'
    );
  }

  return {
    disconnect() {
      disposed = true;
      chatRealtimeClient.removeStatusListener(statusListenerId);
      chatRealtimeClient.removeErrorListener(errorListenerId);
      activeSubscriptions.forEach((subscriptionId) => {
        chatRealtimeClient.unsubscribe(subscriptionId);
      });
      handlers.onStatusChange?.('disconnected');
    },
  };
}

function handleRealtimeMessage(
  message: StompFrame,
  handlers: RealtimeHandlers,
  destination: 'messages' | 'notifications'
) {
  if (!message.body) {
    return;
  }

  try {
    const payload = JSON.parse(message.body);

    if (destination === 'messages') {
      handlers.onMessage?.(payload as RealtimeMessagePayload);
      return;
    }

    handlers.onNotification?.(payload as RealtimeNotificationPayload);
  } catch {
    handlers.onError?.('Could not read realtime payload.');
  }
}
