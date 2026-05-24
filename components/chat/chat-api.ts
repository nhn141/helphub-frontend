import { API_BASE_URL, apiRequest, type ApiEnvelope } from '@/components/auth/auth-api';

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

type StompFrame = {
  command: string;
  headers: Record<string, string>;
  body: string;
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
  content: string
) {
  const response = await apiRequest<ApiEnvelope<ChatMessage>>(
    `/conversations/${conversationId}/messages`,
    {
      accessToken,
      body: JSON.stringify({
        content,
        mediaIds: [],
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

export function extractConversationId(actionUrl: string | null | undefined) {
  const match = actionUrl?.match(/\/conversations\/([0-9a-f-]{36})/i);
  return match?.[1] ?? null;
}

export function extractSupportRequestId(actionUrl: string | null | undefined) {
  const match = actionUrl?.match(/\/support-requests\/([0-9a-f-]{36})/i);
  return match?.[1] ?? null;
}

export function connectChatRealtime(
  accessToken: string,
  handlers: RealtimeHandlers,
  subscriptions: RealtimeSubscriptionOptions = {}
) {
  let socket: WebSocket | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let disposed = false;
  let connected = false;
  const shouldSubscribeMessages = subscriptions.messages ?? true;
  const shouldSubscribeNotifications = subscriptions.notifications ?? true;

  handlers.onStatusChange?.('connecting');

  try {
    socket = new WebSocket(getWebSocketUrl());
  } catch (error) {
    handlers.onStatusChange?.('disconnected');
    handlers.onError?.(error instanceof Error ? error.message : 'Could not open realtime connection.');

    return {
      disconnect() {},
    };
  }

  function sendFrame(command: string, headers: Record<string, string>, body = '') {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(buildStompFrame(command, headers, body));
  }

  function subscribeToQueues() {
    if (shouldSubscribeMessages) {
      sendFrame('SUBSCRIBE', {
        ack: 'auto',
        destination: '/user/queue/messages',
        id: 'helphub-messages',
      });
    }

    if (shouldSubscribeNotifications) {
      sendFrame('SUBSCRIBE', {
        ack: 'auto',
        destination: '/user/queue/notifications',
        id: 'helphub-notifications',
      });
    }
  }

  socket.onopen = () => {
    sendFrame('CONNECT', {
      Authorization: `Bearer ${accessToken}`,
      'accept-version': '1.2',
      'heart-beat': '10000,10000',
    });
  };

  socket.onmessage = (event) => {
    const data = typeof event.data === 'string' ? event.data : String(event.data ?? '');
    const rawFrames = data.split('\0');

    rawFrames.forEach((rawFrame) => {
      if (!rawFrame || rawFrame.trim().length === 0) {
        return;
      }

      const frame = parseStompFrame(rawFrame);

      if (frame.command === 'CONNECTED') {
        connected = true;
        handlers.onStatusChange?.('connected');
        subscribeToQueues();

        heartbeatTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send('\n');
          }
        }, 25000);

        return;
      }

      if (frame.command === 'MESSAGE') {
        handleMessageFrame(frame, handlers);
        return;
      }

      if (frame.command === 'ERROR') {
        handlers.onError?.(frame.body || 'Realtime connection error.');
      }
    });
  };

  socket.onerror = () => {
    if (!disposed) {
      handlers.onError?.('Realtime connection error.');
    }
  };

  socket.onclose = () => {
    connected = false;
    clearHeartbeat();

    if (!disposed) {
      handlers.onStatusChange?.('disconnected');
    }
  };

  function clearHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  return {
    disconnect() {
      disposed = true;
      clearHeartbeat();

      if (socket?.readyState === WebSocket.OPEN) {
        if (connected) {
          sendFrame('DISCONNECT', {
            receipt: 'helphub-disconnect',
          });
        }

        socket.close();
      }

      socket = null;
      handlers.onStatusChange?.('disconnected');
    },
  };
}

function getWebSocketUrl() {
  const apiRoot = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${apiRoot.replace(/^http/i, 'ws')}/ws`;
}

function buildStompFrame(command: string, headers: Record<string, string>, body: string) {
  const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${value}`);
  return [command, ...headerLines, '', body].join('\n') + '\0';
}

function parseStompFrame(rawFrame: string): StompFrame {
  const normalizedFrame = rawFrame.replace(/\r\n/g, '\n');
  const headerEndIndex = normalizedFrame.indexOf('\n\n');

  if (headerEndIndex < 0) {
    return {
      body: '',
      command: normalizedFrame.trim(),
      headers: {},
    };
  }

  const headerLines = normalizedFrame.slice(0, headerEndIndex).split('\n');
  const command = headerLines.shift()?.trim() ?? '';
  const headers = headerLines.reduce<Record<string, string>>((result, line) => {
    const separatorIndex = line.indexOf(':');

    if (separatorIndex > 0) {
      result[line.slice(0, separatorIndex)] = line.slice(separatorIndex + 1);
    }

    return result;
  }, {});
  let body = normalizedFrame.slice(headerEndIndex + 2);
  const contentLength = Number(headers['content-length']);

  if (Number.isFinite(contentLength) && contentLength >= 0) {
    body = body.slice(0, contentLength);
  }

  return {
    body,
    command,
    headers,
  };
}

function handleMessageFrame(frame: StompFrame, handlers: RealtimeHandlers) {
  if (!frame.body) {
    return;
  }

  try {
    const payload = JSON.parse(frame.body);
    const destination = frame.headers.destination ?? '';

    if (destination.includes('/queue/messages')) {
      handlers.onMessage?.(payload as RealtimeMessagePayload);
      return;
    }

    if (destination.includes('/queue/notifications')) {
      handlers.onNotification?.(payload as RealtimeNotificationPayload);
    }
  } catch {
    handlers.onError?.('Could not read realtime payload.');
  }
}
