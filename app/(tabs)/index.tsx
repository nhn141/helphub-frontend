import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, DashboardScreen, SectionHeader, StatCard, SurfaceCard } from '@/components/dashboard/tab-ui';
import { authPalette } from '@/components/auth/auth-ui';
import { useDemoRole } from '@/components/demo-role/demo-role-provider';
import {
  AppRole,
  canManageCategories,
  canViewVolunteerPosts,
  getRoleTone,
} from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

const quickStats = [
  { label: 'Open support requests', value: '24', tone: 'green' as const },
  { label: 'Active community posts', value: '18', tone: 'mint' as const },
  { label: 'Live categories', value: '12', tone: 'slate' as const },
];

const requestHighlights = [
  {
    title: 'Urgent medicine delivery for District 7',
    category: 'Medical',
    address: '12 Nguyen Huu Tho, Ho Chi Minh City',
    status: 'PENDING',
    tone: 'amber' as const,
  },
  {
    title: 'Warm meals for shelter residents',
    category: 'Food Support',
    address: '48 Tran Hung Dao, Da Nang',
    status: 'IN_PROGRESS',
    tone: 'green' as const,
  },
];

const postHighlights = [
  {
    author: 'Anh Nguyen',
    supportRequest: 'Meals for shelter residents',
    content: 'We have collected enough dry food for today and still need two drivers for the evening route.',
    visibility: 'PUBLIC',
  },
  {
    author: 'Minh Tran',
    supportRequest: 'Medicine delivery',
    content: 'Volunteer handoff point has been updated. Please check the address before departure.',
    visibility: 'VOLUNTEERS_ONLY',
  },
];

const categoryHighlights = ['Food Support', 'Medical', 'Transport', 'Education'];

const roleCopy: Record<AppRole, { heroLabel: string; heroTitle: string; firstPill: string; secondPill: string }> = {
  REQUESTER: {
    heroLabel: 'Requester workspace',
    heroTitle: 'Follow your support requests and share updates with the community.',
    firstPill: '2 requests waiting for review',
    secondPill: '3 requests already approved',
  },
  VOLUNTEER: {
    heroLabel: 'Volunteer workspace',
    heroTitle: 'Track urgent needs and keep community updates moving.',
    firstPill: '2 requests need review',
    secondPill: '4 active locations',
  },
  COLLABORATOR: {
    heroLabel: 'Collaborator workspace',
    heroTitle: 'Review incoming requests and keep support locations coordinated.',
    firstPill: '5 requests pending review',
    secondPill: '3 locations need assignment',
  },
  ADMIN: {
    heroLabel: 'Admin workspace',
    heroTitle: 'Monitor operations, categories, and user activity across the platform.',
    firstPill: '6 users changed this week',
    secondPill: '2 categories need updates',
  },
};

export default function HomeTabScreen() {
  const { role } = useDemoRole();
  const visiblePosts = canViewVolunteerPosts(role)
    ? postHighlights
    : postHighlights.filter((item) => item.visibility === 'PUBLIC');
  const copy = roleCopy[role];

  return (
    <DashboardScreen
      title="Community Hub"
      rightSlot={<Badge label={role} tone={getRoleTone(role)} />}>
      <SurfaceCard>
        <Text style={styles.heroLabel}>{copy.heroLabel}</Text>
        <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
        <View style={styles.heroRow}>
          <View style={styles.heroPill}>
            <Feather name="clock" size={14} color={authPalette.primaryDark} />
            <Text style={styles.heroPillText}>{copy.firstPill}</Text>
          </View>
          <View style={styles.heroPill}>
            <Feather name="map-pin" size={14} color={authPalette.primaryDark} />
            <Text style={styles.heroPillText}>{copy.secondPill}</Text>
          </View>
        </View>
      </SurfaceCard>

      <View style={styles.statsRow}>
        {quickStats.map((item) => (
          <StatCard key={item.label} label={item.label} tone={item.tone} value={item.value} />
        ))}
      </View>

      <View>
        <SectionHeader title="Priority Requests" />
        <View style={styles.stack}>
          {requestHighlights.map((item) => (
            <SurfaceCard key={item.title}>
              <View style={styles.cardTop}>
                <Badge label={item.status} tone={item.tone} />
                <Text style={styles.cardMeta}>{item.category}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.cardLine}>
                <Feather name="map-pin" size={14} color={authPalette.muted} />
                <Text style={styles.cardBody}>{item.address}</Text>
              </View>
            </SurfaceCard>
          ))}
        </View>
      </View>

      <View>
        <SectionHeader title="Community Posts" />
        <View style={styles.stack}>
          {visiblePosts.map((item) => (
            <SurfaceCard key={item.author + item.supportRequest}>
              <View style={styles.cardTop}>
                <Text style={styles.cardMeta}>{item.author}</Text>
                <Badge
                  label={item.visibility}
                  tone={item.visibility === 'PUBLIC' ? 'slate' : 'mint'}
                />
              </View>
              <Text style={styles.cardTitle}>{item.supportRequest}</Text>
              <Text style={styles.cardBody}>{item.content}</Text>
            </SurfaceCard>
          ))}
        </View>
      </View>

      {canManageCategories(role) ? (
        <View>
          <SectionHeader title="Active Categories" />
          <SurfaceCard>
            <View style={styles.categoryWrap}>
              {categoryHighlights.map((item) => (
                <View key={item} style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{item}</Text>
                </View>
              ))}
            </View>
          </SurfaceCard>
        </View>
      ) : null}
    </DashboardScreen>
  );
}

const styles = StyleSheet.create({
  heroLabel: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 22,
    lineHeight: 30,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  heroRow: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: '#EEF7F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  heroPillText: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stack: {
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardMeta: {
    fontSize: 12,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 17,
    lineHeight: 24,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  cardLine: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    borderRadius: 999,
    backgroundColor: '#EDF5EF',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryChipText: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
});
