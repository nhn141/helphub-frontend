import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Feather } from '@expo/vector-icons';

import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import { connectChatRealtime, getUnreadNotificationCount } from '@/components/chat/chat-api';
import { useDemoRole } from '@/components/demo-role/demo-role-provider';
import { HapticTab } from '@/components/haptic-tab';
import {
  setUnreadNotificationCount,
  useUnreadNotificationCount,
} from '@/components/notification/notification-state';
import { canManageCategories, canManageSupportLocations } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

export default function TabLayout() {
  const { role } = useDemoRole();
  const { session } = useAuth();
  const unreadNotifications = useUnreadNotificationCount();

  useEffect(() => {
    if (!session?.accessToken) {
      setUnreadNotificationCount(0);
      return;
    }

    let isActive = true;

    getUnreadNotificationCount(session.accessToken)
      .then((response) => {
        if (isActive) {
          setUnreadNotificationCount(Number(response.unreadCount ?? 0));
        }
      })
      .catch(() => {
        if (isActive) {
          setUnreadNotificationCount(0);
        }
      });

    const connection = connectChatRealtime(
      session.accessToken,
      {
        onNotification(payload) {
          setUnreadNotificationCount(Number(payload.unreadCount ?? 0));
        },
      },
      {
        messages: false,
        notifications: true,
      }
    );

    return () => {
      isActive = false;
      connection.disconnect();
    };
  }, [session?.accessToken]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: authPalette.primaryDark,
        tabBarInactiveTintColor: '#849085',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 76,
          paddingTop: 10,
          paddingBottom: 12,
          borderTopWidth: 0,
          backgroundColor: '#FBFEFB',
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.rounded,
          fontSize: 11,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather size={20} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color }) => <Feather size={20} name="clipboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: 'Posts',
          tabBarIcon: ({ color }) => <Feather size={20} name="file-text" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <Feather size={20} name="message-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarBadge:
            unreadNotifications > 0
              ? unreadNotifications > 99
                ? '99+'
                : unreadNotifications
              : undefined,
          tabBarIcon: ({ color }) => <Feather size={20} name="bell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          href: canManageCategories(role) ? undefined : null,
          tabBarIcon: ({ color }) => <Feather size={20} name="grid" color={color} />,
        }}
      />
      <Tabs.Screen
        name="support-locations"
        options={{
          title: 'Locations',
          href: canManageSupportLocations(role) ? undefined : null,
          tabBarIcon: ({ color }) => <Feather size={20} name="map-pin" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Feather size={20} name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
