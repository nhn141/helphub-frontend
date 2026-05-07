import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';

import { Badge, DashboardScreen, SurfaceCard } from '@/components/dashboard/tab-ui';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import { useDemoRole } from '@/components/demo-role/demo-role-provider';
import { getRoleTone } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

export default function ProfileTabScreen() {
  const { isAuthenticated, logout, user } = useAuth();
  const { role } = useDemoRole();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const displayName = user?.fullName ?? 'Guest User';
  const displayEmail = user?.email ?? 'guest@helphub.app';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logout();
      router.replace('/login' as never);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <DashboardScreen
      title="My Profile"
      rightSlot={<Badge label={role} tone={getRoleTone(role)} />}>
      <SurfaceCard>
        <View style={styles.profileTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || 'HH'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{displayEmail}</Text>
          </View>
        </View>

        <View style={styles.metaStack}>
          <View style={styles.metaRow}>
            <Feather name="phone" size={15} color={authPalette.muted} />
            <Text style={styles.metaText}>{user?.phone ?? 'No phone number'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Feather name="clock" size={15} color={authPalette.muted} />
            <Text style={styles.metaText}>Last login: {user?.lastLoginAt ?? 'Not available'}</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isLoggingOut}
          onPress={handleLogout}
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}>
          <Feather name="log-out" size={16} color={authPalette.primaryDark} />
          <Text style={styles.logoutText}>
            {isLoggingOut ? 'Signing out...' : isAuthenticated ? 'Log out' : 'Back to Login'}
          </Text>
        </Pressable>
      </SurfaceCard>
    </DashboardScreen>
  );
}

const styles = StyleSheet.create({
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DDF5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  email: {
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  metaStack: {
    marginTop: 18,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  logoutButton: {
    marginTop: 24,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1.4,
    borderColor: authPalette.outline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonDisabled: {
    opacity: 0.62,
  },
  logoutText: {
    fontSize: 14,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
});
