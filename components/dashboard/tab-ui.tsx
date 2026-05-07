import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authPalette } from '@/components/auth/auth-ui';
import { Fonts } from '@/constants/theme';

type DashboardScreenProps = {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
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
  rightSlot,
  children,
}: DashboardScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <View style={styles.titleStage}>
              <View style={styles.titleGlowMint} />
              <View style={styles.titleGlowCoral} />
              <Text style={styles.title}>{title}</Text>
              <View style={styles.titleAccent}>
                <View style={styles.titleAccentDot} />
                <View style={styles.titleAccentLine} />
              </View>
            </View>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  titleStage: {
    alignSelf: 'flex-start',
    position: 'relative',
    paddingTop: 8,
    paddingRight: 16,
    paddingBottom: 10,
  },
  titleGlowMint: {
    position: 'absolute',
    left: -10,
    top: 0,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#BDF6D7',
    opacity: 0.62,
  },
  titleGlowCoral: {
    position: 'absolute',
    right: -6,
    bottom: 8,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFD4C7',
    opacity: 0.72,
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    textShadowColor: 'rgba(146, 240, 200, 0.78)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  titleAccent: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  titleAccentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: authPalette.coral,
  },
  titleAccentLine: {
    width: 72,
    height: 4,
    borderRadius: 999,
    backgroundColor: authPalette.mint,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
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
