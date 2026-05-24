import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  connectChatRealtime,
  extractConversationId,
  extractSupportRequestId,
  formatChatDateTime,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from '@/components/chat/chat-api';
import { Fonts } from '@/constants/theme';

export default function NotificationsTabScreen() {
  const router = useRouter();
  const { isAuthenticated, session } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      setNotifications(notificationData);
      setUnreadCount(Number(unreadData.unreadCount ?? 0));
    } catch (loadError: any) {
      setError(loadError?.message ?? 'Could not load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, loadNotifications]);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }

    const connection = connectChatRealtime(
      session.accessToken,
      {
        onNotification(payload) {
          setNotifications((current) => [
            payload.notification,
            ...current.filter((notification) => notification.id !== payload.notification.id),
          ]);
          setUnreadCount(Number(payload.unreadCount ?? 0));
        },
      },
      {
        messages: false,
        notifications: true,
      }
    );

    return () => {
      connection.disconnect();
    };
  }, [session?.accessToken]);

  async function handleNotificationPress(notification: NotificationItem) {
    if (!session?.accessToken) {
      return;
    }

    if (!notification.isRead) {
      try {
        const updatedNotification = await markNotificationAsRead(
          session.accessToken,
          notification.id
        );

        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? updatedNotification : item))
        );
        setUnreadCount((current) => Math.max(0, current - 1));
      } catch {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    }

    const conversationId = extractConversationId(notification.actionUrl);

    if (conversationId) {
      router.push({
        pathname: '/(tabs)/chat',
        params: { conversationId },
      });
      return;
    }

    const supportRequestId = extractSupportRequestId(notification.actionUrl);

    if (supportRequestId) {
      router.push({
        pathname: '/support-request-detail',
        params: { id: supportRequestId },
      });
    }
  }

  async function handleMarkAllRead() {
    if (!session?.accessToken || unreadCount === 0) {
      return;
    }

    try {
      await markAllNotificationsAsRead(session.accessToken);
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
      setUnreadCount(0);
    } catch (readError: any) {
      setError(readError?.message ?? 'Could not update notifications.');
    }
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.authRequired}>
          <View style={styles.authIcon}>
            <Feather name="lock" size={24} color={authPalette.primaryDark} />
          </View>
          <Text style={styles.authTitle}>Login required</Text>
          <Text style={styles.authText}>Notifications are available after login.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/login')}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>{unreadCount} unread</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable accessibilityRole="button" onPress={loadNotifications} style={styles.iconButton}>
              <Feather name="refresh-cw" size={19} color={authPalette.primaryDark} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={unreadCount === 0}
              onPress={handleMarkAllRead}
              style={[styles.iconButton, unreadCount === 0 && styles.iconButtonDisabled]}>
              <Feather name="check-circle" size={19} color={authPalette.primaryDark} />
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color="#AE3F3A" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => setError(null)}>
              <Feather name="x" size={18} color="#AE3F3A" />
            </Pressable>
          </View>
        ) : null}

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {isLoading ? <Text style={styles.helperText}>Loading notifications...</Text> : null}

          {!isLoading && notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="bell-off" size={36} color="#AEBAB0" />
              <Text style={styles.emptyTitle}>No notifications</Text>
            </View>
          ) : null}

          {notifications.map((notification) => (
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
                  name={notification.referenceType === 'MESSAGE' ? 'message-circle' : 'bell'}
                  size={17}
                  color={authPalette.primaryDark}
                />
              </View>
              <View style={styles.notificationText}>
                <Text style={styles.notificationContent} numberOfLines={3}>
                  {notification.content ?? 'New notification'}
                </Text>
                <Text style={styles.notificationTime}>
                  {formatChatDateTime(notification.createdAt)}
                </Text>
              </View>
              {!notification.isRead ? <View style={styles.unreadDot} /> : null}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6FAF6',
  },
  screen: {
    flex: 1,
    gap: 12,
    paddingBottom: 92,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#ECF5EF',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconButtonDisabled: {
    opacity: 0.45,
  },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: '#FDE7E6',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: '#AE3F3A',
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
  },
  listContent: {
    gap: 9,
    paddingBottom: 12,
  },
  notificationCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EDF2EE',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 72,
    padding: 12,
  },
  notificationCardUnread: {
    backgroundColor: '#F0FAF5',
    borderColor: '#A8E9C4',
  },
  notificationIcon: {
    alignItems: 'center',
    backgroundColor: '#E4F7EB',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  notificationText: {
    flex: 1,
    minWidth: 0,
  },
  notificationContent: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 20,
  },
  notificationTime: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 11,
    marginTop: 5,
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
    lineHeight: 19,
    padding: 12,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 64,
  },
  emptyTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
  authRequired: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  authIcon: {
    alignItems: 'center',
    backgroundColor: '#E4F7EB',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  authTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 20,
  },
  authText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: authPalette.primaryDark,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 44,
    minWidth: 110,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },
});
