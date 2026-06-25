import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import { NotificationBell } from '@/components/notification/notification-menu';
import { UserAvatar } from '@/components/user/user-avatar';
import { Fonts } from '@/constants/theme';

type DashboardScreenProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

type StatCardProps = {
  label: string;
  value: string;
  tone?: 'green' | 'mint' | 'amber' | 'slate';
};

type BadgeProps = {
  label: string;
  tone?: 'green' | 'mint' | 'amber' | 'slate' | 'red';
};

type FilterChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

type SurfaceCardProps = {
  children: ReactNode;
};

export function DashboardScreen({
  title,
  subtitle,
  children,
}: DashboardScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <DashboardTopHeader subtitle={subtitle} title={title} />
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function DashboardTopHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth();
  const displayName = user?.fullName ?? 'Guest User';

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Open profile"
        accessibilityRole="button"
        onPress={() => router.push('/(tabs)/profile')}
        style={styles.profileButton}>
        <UserAvatar
          fallback="HH"
          name={displayName}
          openable={false}
          size={38}
          style={styles.profileAvatar}
          textSize={13}
          uri={user?.avatarUrl}
        />
      </Pressable>
      <View style={styles.headerTitleWrap}>
        <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.headerSide}>
        <NotificationBell />
      </View>
    </View>
  );
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

export function StatCard({ label, value, tone = 'green' }: StatCardProps) {
  return (
    <View style={[styles.statCard, toneStyles[tone].surface]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Badge({ label, tone = 'green' }: BadgeProps) {
  return (
    <View style={[styles.badge, toneStyles[tone].surface]}>
      <Text style={[styles.badgeText, toneStyles[tone].text]}>{label}</Text>
    </View>
  );
}

export function FilterChip({ label, active = false, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.filterChip, active ? styles.filterChipActive : styles.filterChipIdle]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function SurfaceCard({ children }: SurfaceCardProps) {
  return <View style={styles.surfaceCard}>{children}</View>;
}

const toneStyles = {
  green: {
    surface: { backgroundColor: '#E5F6ED' },
    text: { color: authPalette.primaryDark },
  },
  mint: {
    surface: { backgroundColor: '#D8F8E7' },
    text: { color: authPalette.primaryDark },
  },
  amber: {
    surface: { backgroundColor: '#FFF1D8' },
    text: { color: '#9A6500' },
  },
  slate: {
    surface: { backgroundColor: '#EEF2EF' },
    text: { color: '#536158' },
  },
  red: {
    surface: { backgroundColor: '#FDE7E6' },
    text: { color: '#AE3F3A' },
  },
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6FAF6',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F6FAF6',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    zIndex: 20,
  },
  headerSide: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
  },
  headerTitleWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFF4CF',
    borderRadius: 999,
    justifyContent: 'center',
    maxWidth: '100%',
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: 26,
    paddingVertical: 7,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    textAlign: 'center',
    textShadowColor: 'rgba(146, 240, 200, 0.55)',
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 8,
  },
  profileButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
  },
  profileAvatar: {
    backgroundColor: '#DDF5E8',
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 10,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    textShadowColor: 'rgba(146, 240, 200, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  statLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: Fonts.rounded,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipIdle: {
    backgroundColor: '#EDF2ED',
  },
  filterChipActive: {
    backgroundColor: authPalette.primaryDark,
  },
  filterChipText: {
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  surfaceCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#0F4B34',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
});
