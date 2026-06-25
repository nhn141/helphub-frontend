import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Feather } from '@expo/vector-icons';

import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import { connectChatRealtime, getUnreadNotificationCount } from '@/components/chat/chat-api';
import { HapticTab } from '@/components/haptic-tab';
import {
  clearMessageNotificationMeta,
  clearNotificationItems,
  setUnreadNotificationCount,
  upsertMessageNotificationMeta,
  upsertNotificationItem,
} from '@/components/notification/notification-state';
import { Fonts } from '@/constants/theme';

export default function TabLayout() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.accessToken) {
      clearMessageNotificationMeta();
      clearNotificationItems();
      setUnreadNotificationCount(0);
      return;
    }

    let isActive = true;
    const accessToken = session.accessToken;

    function refreshUnreadCount() {
      getUnreadNotificationCount(accessToken)
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
    }

    refreshUnreadCount();

    const connection = connectChatRealtime(
      accessToken,
      {
        onMessage(payload) {
          upsertMessageNotificationMeta(payload.message);
        },
        onNotification(payload) {
          upsertNotificationItem(payload.notification);
          setUnreadNotificationCount(Number(payload.unreadCount ?? 0));
        },
        onStatusChange(status) {
          if (status === 'connected') {
            refreshUnreadCount();
          }
        },
      },
      {
        messages: true,
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
        name="support"
        options={{
          title: 'Request',
          tabBarIcon: ({ color }) => <Feather size={20} name="clipboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Feather size={20} name="map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color }) => <Feather size={20} name="users" color={color} />,
        }}
      />
      <Tabs.Screen
        name="funds"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="system"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="support-locations"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
