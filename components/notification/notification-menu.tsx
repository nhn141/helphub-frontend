import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import {
  extractConversationId,
  extractReportId,
  extractSupportRequestId,
  formatChatDateTime,
  getConversationMessages,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from '@/components/chat/chat-api';
import {
  decrementUnreadNotificationCount,
  removeNotificationItems,
  setNotificationItems,
  setUnreadNotificationCount,
  updateNotificationItems,
  useMessageNotificationMetaByMessageId,
  useNotificationItems,
  useUnreadNotificationCount,
  type MessageNotificationMeta,
} from '@/components/notification/notification-state';
import { Fonts } from '@/constants/theme';

type DisplayNotification = {
  conversationId: string | null;
  content: string;
  createdAt: string;
  id: string;
  isMessage: boolean;
  isRead: boolean;
  notifications: NotificationItem[];
  reportId: string | null;
  supportRequestId: string | null;
};

function getNotificationTime(value: string) {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = Date.parse(normalized);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function getLatestNotification(notifications: NotificationItem[]) {
  return notifications.reduce((latest, notification) =>
    getNotificationTime(notification.createdAt) > getNotificationTime(latest.createdAt)
      ? notification
      : latest
  );
}

function buildDisplayNotifications(
  notifications: NotificationItem[],
  messageMeta: Record<string, MessageNotificationMeta>,
  realtimeMessageMeta: Record<string, MessageNotificationMeta>
) {
  const messageGroups = new Map<string, NotificationItem[]>();
  const displayNotifications: DisplayNotification[] = [];

  notifications.forEach((notification) => {
    const conversationId = extractConversationId(notification.actionUrl);

    if (notification.referenceType === 'MESSAGE' && conversationId) {
      if (notification.isRead) {
        return;
      }

      const meta =
        messageMeta[notification.id] ??
        (notification.referenceId ? realtimeMessageMeta[notification.referenceId] : undefined);
      const senderKey = meta?.senderId ?? notification.referenceId ?? notification.id;
      const groupKey = `message:${conversationId}:${senderKey}`;
      const group = messageGroups.get(groupKey) ?? [];

      group.push(notification);
      messageGroups.set(groupKey, group);
      return;
    }

    displayNotifications.push({
      conversationId: null,
      content: notification.content ?? 'New notification',
      createdAt: notification.createdAt,
      id: notification.id,
      isMessage: false,
      isRead: notification.isRead,
      notifications: [notification],
      reportId: extractReportId(notification.actionUrl),
      supportRequestId: extractSupportRequestId(notification.actionUrl),
    });
  });

  messageGroups.forEach((group, groupKey) => {
    const latestNotification = getLatestNotification(group);
    const unreadCount = group.filter((notification) => !notification.isRead).length;
    const messageCount = unreadCount > 0 ? unreadCount : group.length;
    const senderMeta =
      messageMeta[latestNotification.id] ??
      (latestNotification.referenceId
        ? realtimeMessageMeta[latestNotification.referenceId]
        : undefined) ??
      group.map((notification) => messageMeta[notification.id]).find(Boolean);
    const senderName = senderMeta?.senderName?.trim() || 'Someone';

    displayNotifications.push({
      conversationId: extractConversationId(latestNotification.actionUrl),
      content: `${senderName} sent you ${messageCount} message${messageCount > 1 ? 's' : ''}`,
      createdAt: latestNotification.createdAt,
      id: groupKey,
      isMessage: true,
      isRead: unreadCount === 0,
      notifications: group,
      reportId: null,
      supportRequestId: null,
    });
  });

  return displayNotifications.sort(
    (left, right) => getNotificationTime(right.createdAt) - getNotificationTime(left.createdAt)
  );
}

function formatBadgeCount(count: number) {
  return count > 99 ? '99+' : String(count);
}

export function NotificationBell() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isAuthenticated, session } = useAuth();
  const notifications = useNotificationItems();
  const realtimeMessageMeta = useMessageNotificationMetaByMessageId();
  const unreadCount = useUnreadNotificationCount();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageNotificationMeta, setMessageNotificationMeta] = useState<
    Record<string, MessageNotificationMeta>
  >({});

  const displayNotifications = useMemo(
    () => buildDisplayNotifications(notifications, messageNotificationMeta, realtimeMessageMeta),
    [messageNotificationMeta, notifications, realtimeMessageMeta]
  );
  const menuWidth = Math.min(width - 32, 340);

  const loadNotifications = useCallback(async () => {
    if (!session?.accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [notificationData, unreadData] = await Promise.all([
        getMyNotifications(session.accessToken),
        getUnreadNotificationCount(session.accessToken),
      ]);

      setNotificationItems(notificationData);
      setUnreadNotificationCount(Number(unreadData.unreadCount ?? 0));
    } catch (loadError: any) {
      setError(loadError?.message ?? 'Could not load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, isOpen, loadNotifications]);

  useEffect(() => {
    if (!isOpen || !session?.accessToken) {
      return;
    }

    const missingNotificationsByConversation = new Map<string, NotificationItem[]>();

    notifications.forEach((notification) => {
      const conversationId = extractConversationId(notification.actionUrl);

      if (
        notification.referenceType !== 'MESSAGE' ||
        !conversationId ||
        !notification.referenceId ||
        messageNotificationMeta[notification.id] ||
        realtimeMessageMeta[notification.referenceId]
      ) {
        return;
      }

      const group = missingNotificationsByConversation.get(conversationId) ?? [];
      group.push(notification);
      missingNotificationsByConversation.set(conversationId, group);
    });

    if (missingNotificationsByConversation.size === 0) {
      return;
    }

    let isActive = true;
    const accessToken = session.accessToken;

    async function loadMessageNotificationMeta() {
      const metaResults = await Promise.all(
        Array.from(missingNotificationsByConversation.entries()).map(
          async ([conversationId, conversationNotifications]) => {
            try {
              const messages = await getConversationMessages(accessToken, conversationId);
              const messageById = new Map(messages.map((message) => [message.id, message]));

              return conversationNotifications.reduce<Record<string, MessageNotificationMeta>>(
                (result, notification) => {
                  const message = notification.referenceId
                    ? messageById.get(notification.referenceId)
                    : null;

                  if (message) {
                    result[notification.id] = {
                      conversationId,
                      senderId: message.senderId,
                      senderName: message.senderName,
                    };
                  }

                  return result;
                },
                {}
              );
            } catch {
              return {};
            }
          }
        )
      );

      if (!isActive) {
        return;
      }

      const nextMeta = metaResults.reduce<Record<string, MessageNotificationMeta>>(
        (result, item) => ({
          ...result,
          ...item,
        }),
        {}
      );

      if (Object.keys(nextMeta).length > 0) {
        setMessageNotificationMeta((current) => ({
          ...current,
          ...nextMeta,
        }));
      }
    }

    loadMessageNotificationMeta();

    return () => {
      isActive = false;
    };
  }, [isOpen, messageNotificationMeta, notifications, realtimeMessageMeta, session?.accessToken]);

  async function markDisplayNotificationRead(displayNotification: DisplayNotification) {
    if (!session?.accessToken) {
      return;
    }

    const displayNotificationIds = displayNotification.notifications.map(
      (notification) => notification.id
    );
    const unreadNotifications = displayNotification.notifications.filter(
      (notification) => !notification.isRead
    );

    if (unreadNotifications.length === 0) {
      if (displayNotification.isMessage) {
        removeNotificationItems(displayNotificationIds);
      }
      return;
    }

    const results = await Promise.allSettled(
      unreadNotifications.map((notification) =>
        markNotificationAsRead(session.accessToken, notification.id)
      )
    );
    const updatedNotifications = new Map<string, NotificationItem>();

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        updatedNotifications.set(unreadNotifications[index].id, result.value);
      }
    });

    if (updatedNotifications.size > 0) {
      decrementUnreadNotificationCount(updatedNotifications.size);

      if (
        displayNotification.isMessage &&
        updatedNotifications.size === unreadNotifications.length
      ) {
        removeNotificationItems(displayNotificationIds);
      } else {
        updateNotificationItems(updatedNotifications);
      }
    }

    if (updatedNotifications.size < unreadNotifications.length) {
      setError('Could not update some notifications.');
    }
  }

  async function handleNotificationPress(displayNotification: DisplayNotification) {
    await markDisplayNotificationRead(displayNotification);
    setIsOpen(false);

    if (displayNotification.conversationId) {
      router.push({
        pathname: '/(tabs)/social',
        params: { conversationId: displayNotification.conversationId, view: 'chat' },
      });
      return;
    }

    if (displayNotification.supportRequestId) {
      router.push({
        pathname: '/support-request-detail',
        params: { id: displayNotification.supportRequestId },
      });
      return;
    }

    if (displayNotification.reportId) {
      router.push({
        pathname: '/report-detail' as never,
        params: { id: displayNotification.reportId },
      });
    }
  }

  async function handleMarkAllRead() {
    if (!session?.accessToken || unreadCount === 0) {
      return;
    }

    try {
      await markAllNotificationsAsRead(session.accessToken);
      setNotificationItems(
        notifications.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
      setUnreadNotificationCount(0);
    } catch (readError: any) {
      setError(readError?.message ?? 'Could not update notifications.');
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Notifications"
        accessibilityRole="button"
        onPress={() => setIsOpen((current) => !current)}
        style={styles.bellButton}>
        <Feather name="bell" size={20} color={authPalette.primaryDark} />
        {unreadCount > 0 ? (
          <View style={styles.countBadge}>
            <Text adjustsFontSizeToFit numberOfLines={1} style={styles.countText}>
              {formatBadgeCount(unreadCount)}
            </Text>
          </View>
        ) : null}
      </Pressable>

      {isOpen ? (
        <View style={[styles.menu, { width: menuWidth }]}>
          <View style={styles.menuHeader}>
            <View style={styles.menuHeaderCopy}>
              <Text style={styles.menuTitle}>Notifications</Text>
              <Text style={styles.menuSubtitle}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'No unread notifications'}
              </Text>
            </View>
            <View style={styles.menuActions}>
              <Pressable accessibilityRole="button" onPress={loadNotifications} style={styles.iconButton}>
                <Feather name="refresh-cw" size={17} color={authPalette.primaryDark} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={unreadCount === 0}
                onPress={handleMarkAllRead}
                style={[styles.iconButton, unreadCount === 0 && styles.iconButtonDisabled]}>
                <Feather name="check-circle" size={17} color={authPalette.primaryDark} />
              </Pressable>
            </View>
          </View>

          {!isAuthenticated ? (
            <View style={styles.emptyState}>
              <Feather name="lock" size={28} color="#AEBAB0" />
              <Text style={styles.emptyTitle}>Login required</Text>
              <Text style={styles.emptyBody}>Notifications are available after login.</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setIsOpen(false);
                  router.push('/login');
                }}
                style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Login</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {error ? (
                <View style={styles.errorBanner}>
                  <Feather name="alert-circle" size={15} color="#AE3F3A" />
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable accessibilityRole="button" onPress={() => setError(null)}>
                    <Feather name="x" size={17} color="#AE3F3A" />
                  </Pressable>
                </View>
              ) : null}

              <ScrollView
                contentContainerStyle={styles.listContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                style={styles.list}>
                {isLoading ? <Text style={styles.helperText}>Loading notifications...</Text> : null}

                {!isLoading && displayNotifications.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Feather name="bell-off" size={30} color="#AEBAB0" />
                    <Text style={styles.emptyTitle}>No notifications</Text>
                  </View>
                ) : null}

                {displayNotifications.map((notification) => (
                  <Pressable
                    accessibilityRole="button"
                    key={notification.id}
                    onPress={() => handleNotificationPress(notification)}
                    style={[
                      styles.notificationCard,
                      !notification.isRead && styles.notificationCardUnread,
                    ]}>
                    <View style={styles.notificationIcon}>
                      <Feather
                        name={
                          notification.isMessage
                            ? 'message-circle'
                            : notification.reportId
                              ? 'flag'
                              : 'bell'
                        }
                        size={16}
                        color={authPalette.primaryDark}
                      />
                    </View>
                    <View style={styles.notificationText}>
                      <Text numberOfLines={3} style={styles.notificationContent}>
                        {notification.content}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatChatDateTime(notification.createdAt)}
                      </Text>
                    </View>
                    {!notification.isRead ? <View style={styles.unreadDot} /> : null}
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 40,
  },
  bellButton: {
    alignItems: 'center',
    backgroundColor: '#ECF5EF',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    width: 40,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: authPalette.coral,
    borderColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 1.5,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -3,
    top: -4,
  },
  countText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 10,
    lineHeight: 14,
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE6DF',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 8,
    maxHeight: 440,
    padding: 12,
    position: 'absolute',
    right: 0,
    shadowColor: '#0F4B34',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    top: 48,
    zIndex: 80,
  },
  menuHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  menuHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  menuTitle: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 17,
  },
  menuSubtitle: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
    marginTop: 3,
  },
  menuActions: {
    flexDirection: 'row',
    gap: 7,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#ECF5EF',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  iconButtonDisabled: {
    opacity: 0.45,
  },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: '#FDE7E6',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 7,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  errorText: {
    color: '#AE3F3A',
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 12,
    lineHeight: 17,
  },
  list: {
    marginTop: 10,
    maxHeight: 326,
  },
  listContent: {
    gap: 8,
    paddingBottom: 2,
  },
  notificationCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EDF2EE',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 68,
    padding: 10,
  },
  notificationCardUnread: {
    backgroundColor: '#F0FAF5',
    borderColor: '#A8E9C4',
  },
  notificationIcon: {
    alignItems: 'center',
    backgroundColor: '#E4F7EB',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  notificationText: {
    flex: 1,
    minWidth: 0,
  },
  notificationContent: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
  },
  notificationTime: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 11,
    marginTop: 4,
  },
  unreadDot: {
    backgroundColor: authPalette.coral,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  helperText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
    padding: 10,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 36,
  },
  emptyTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },
  emptyBody: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: authPalette.primaryDark,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 38,
    minWidth: 96,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 14,
  },
});
