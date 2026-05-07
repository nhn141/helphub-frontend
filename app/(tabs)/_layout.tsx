import { Tabs } from 'expo-router';
import React from 'react';
import { Feather } from '@expo/vector-icons';

import { authPalette } from '@/components/auth/auth-ui';
import { useDemoRole } from '@/components/demo-role/demo-role-provider';
import { HapticTab } from '@/components/haptic-tab';
import { canManageCategories, canManageSupportLocations } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

export default function TabLayout() {
  const { role } = useDemoRole();

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
          tabBarIcon: ({ color }) => <Feather size={20} name="message-circle" color={color} />,
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
