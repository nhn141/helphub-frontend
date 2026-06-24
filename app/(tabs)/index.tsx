import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import {
  getAdminDashboardStatistics,
  type AdminDashboardStatistics,
} from '@/components/dashboard/dashboard-api';
import { Badge, DashboardScreen, SectionHeader, StatCard, SurfaceCard } from '@/components/dashboard/tab-ui';
import { useDemoRole } from '@/components/demo-role/demo-role-provider';
import { formatCurrency, getCommunityFunds, type CommunityFundSummary } from '@/components/finance/finance-api';
import { getSupportLocations, type SupportLocationSummary } from '@/components/management/support-location-api';
import {
  getMySupportRequests,
  getMyVolunteerAssignments,
  getStatusTone,
  getSupportRequests,
  type SupportRequestSummary,
  type VolunteerAssignment,
} from '@/components/support-request/request-api';
import { AppRole, getRoleTone } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

const roleCopy: Record<AppRole, { label: string; title: string }> = {
  REQUESTER: {
    label: 'Requester workspace',
    title: 'Create requests, follow review progress, and coordinate the support you need.',
  },
  VOLUNTEER: {
    label: 'Volunteer workspace',
    title: 'Track your assignments and find approved requests that need another pair of hands.',
  },
  COLLABORATOR: {
    label: 'Collaborator workspace',
    title: 'Coordinate support requests, locations, and the funds that keep community work moving.',
  },
  ADMIN: {
    label: 'Admin workspace',
    title: 'Monitor platform activity and move quickly to the work that needs review.',
  },
};

export default function HomeTabScreen() {
  const { session, user } = useAuth();
  const { role } = useDemoRole();
  const [requests, setRequests] = useState<SupportRequestSummary[]>([]);
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [locations, setLocations] = useState<SupportLocationSummary[]>([]);
  const [funds, setFunds] = useState<CommunityFundSummary[]>([]);
  const [adminStatistics, setAdminStatistics] = useState<AdminDashboardStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const copy = roleCopy[role];

  const loadDashboard = useCallback(async () => {
    if (!session?.accessToken) {
      return;
    }

    setIsLoading(true);
    setError('');
    const accessToken = session.accessToken;

    try {
      const fundPromise = getCommunityFunds(accessToken, true);

      if (role === 'REQUESTER') {
        const [requestData, fundData] = await Promise.all([
          getMySupportRequests(accessToken),
          fundPromise,
        ]);
        setRequests(requestData);
        setFunds(fundData);
        setAssignments([]);
        setLocations([]);
        setAdminStatistics(null);
      } else if (role === 'VOLUNTEER') {
        const [requestData, assignmentData, fundData] = await Promise.all([
          getSupportRequests(accessToken),
          getMyVolunteerAssignments(accessToken),
          fundPromise,
        ]);
        setRequests(requestData);
        setAssignments(assignmentData);
        setFunds(fundData);
        setLocations([]);
        setAdminStatistics(null);
      } else if (role === 'COLLABORATOR') {
        const [requestData, locationData, fundData] = await Promise.all([
          getSupportRequests(accessToken),
          getSupportLocations(accessToken, false),
          fundPromise,
        ]);
        setRequests(requestData);
        setLocations(locationData);
        setFunds(fundData);
        setAssignments([]);
        setAdminStatistics(null);
      } else {
        const [requestData, fundData, statisticsData] = await Promise.all([
          getSupportRequests(accessToken),
          fundPromise,
          getAdminDashboardStatistics(accessToken),
        ]);
        setRequests(requestData);
        setFunds(fundData);
        setAdminStatistics(statisticsData);
        setAssignments([]);
        setLocations([]);
      }
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [role, session?.accessToken]);

  useFocusEffect(useCallback(() => void loadDashboard(), [loadDashboard]));

  const stats = useMemo(() => {
    if (role === 'REQUESTER') {
      return [
        { label: 'My requests', value: requests.length, tone: 'green' as const },
        { label: 'Pending review', value: requests.filter((item) => item.status === 'PENDING').length, tone: 'amber' as const },
        { label: 'In progress', value: requests.filter((item) => item.status === 'IN_PROGRESS').length, tone: 'mint' as const },
      ];
    }
    if (role === 'VOLUNTEER') {
      return [
        { label: 'Assignments', value: assignments.length, tone: 'green' as const },
        { label: 'Accepted', value: assignments.filter((item) => item.status === 'ACCEPTED').length, tone: 'mint' as const },
        { label: 'Completed', value: assignments.filter((item) => item.status === 'COMPLETED').length, tone: 'slate' as const },
      ];
    }
    if (role === 'COLLABORATOR') {
      return [
        { label: 'Pending requests', value: requests.filter((item) => item.status === 'PENDING').length, tone: 'amber' as const },
        { label: 'Active locations', value: locations.filter((item) => item.isActive).length, tone: 'mint' as const },
        { label: 'Community funds', value: funds.length, tone: 'green' as const },
      ];
    }
    return [
      { label: 'Users', value: adminStatistics?.users.totalUsers ?? 0, tone: 'green' as const },
      { label: 'Pending requests', value: adminStatistics?.supportRequests.pending ?? 0, tone: 'amber' as const },
      { label: 'Pending reports', value: adminStatistics?.reports.pending ?? 0, tone: 'slate' as const },
    ];
  }, [adminStatistics, assignments, funds.length, locations, requests, role]);

  const priorityRequests = requests
    .filter((item) => item.status === 'PENDING' || item.status === 'APPROVED' || item.status === 'IN_PROGRESS')
    .slice(0, 3);
  const fundBalance = funds.reduce((sum, fund) => sum + Number(fund.totalBalance || 0), 0);

  return (
    <DashboardScreen title="Community Hub" rightSlot={<Badge label={role} tone={getRoleTone(role)} />}>
      <SurfaceCard>
        <Text style={styles.heroLabel}>{copy.label}</Text>
        <Text style={styles.heroTitle}>{copy.title}</Text>
        <Text style={styles.welcomeText}>Welcome back, {user?.fullName ?? 'community member'}.</Text>
      </SurfaceCard>

      {error ? (
        <SurfaceCard>
          <Text style={styles.errorTitle}>Could not refresh the dashboard</Text>
          <Text style={styles.helperText}>{error}</Text>
          <Pressable onPress={loadDashboard}><Text style={styles.inlineLink}>Try again</Text></Pressable>
        </SurfaceCard>
      ) : isLoading && requests.length === 0 && funds.length === 0 ? (
        <SurfaceCard><Text style={styles.helperText}>Loading your workspace...</Text></SurfaceCard>
      ) : null}

      <View style={styles.statsRow}>
        {stats.map((item) => (
          <StatCard key={item.label} label={item.label} tone={item.tone} value={String(item.value)} />
        ))}
      </View>

      <View>
        <SectionHeader title="Quick actions" />
        <SurfaceCard>
          <View style={styles.actionGrid}>
            {role === 'REQUESTER' ? (
              <ActionCard icon="plus-circle" label="Create request" onPress={() => router.push('/support-request-create')} />
            ) : (
              <ActionCard icon="clipboard" label="Support requests" onPress={() => router.push('/(tabs)/support')} />
            )}
            {role === 'ADMIN' ? (
              <ActionCard icon="bar-chart-2" label="Statistics" onPress={() => router.push('/admin-statistics' as never)} />
            ) : role === 'COLLABORATOR' ? (
              <ActionCard
                icon="map-pin"
                label="Support locations"
                onPress={() => router.push({ pathname: '/(tabs)/support', params: { view: 'locations' } })}
              />
            ) : role === 'VOLUNTEER' ? (
              <ActionCard icon="check-circle" label="My assignments" onPress={() => router.push('/(tabs)/support')} />
            ) : (
              <ActionCard icon="folder" label="My requests" onPress={() => router.push('/support-request-my')} />
            )}
            <ActionCard icon="dollar-sign" label="Community funds" onPress={() => router.push('/(tabs)/funds' as never)} />
            <ActionCard icon="message-circle" label="Community chat" onPress={() => router.push({ pathname: '/(tabs)/social', params: { view: 'chat' } })} />
          </View>
        </SurfaceCard>
      </View>

      {role === 'VOLUNTEER' && assignments.length > 0 ? (
        <View>
          <SectionHeader title="My assignments" />
          <View style={styles.stack}>
            {assignments.slice(0, 3).map((assignment) => (
              <Pressable
                key={assignment.supportRequestId}
                onPress={() => router.push({ pathname: '/support-request-detail', params: { id: assignment.supportRequestId } })}>
                <SurfaceCard>
                  <View style={styles.cardTop}>
                    <Badge label={assignment.status} tone={assignment.status === 'ACCEPTED' ? 'green' : assignment.status === 'PENDING' ? 'amber' : 'slate'} />
                    <Text style={styles.cardMeta}>{assignment.requesterName}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{assignment.supportRequestTitle}</Text>
                </SurfaceCard>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View>
        <SectionHeader title={role === 'REQUESTER' ? 'My active requests' : 'Priority requests'} />
        {priorityRequests.length === 0 ? (
          <SurfaceCard><Text style={styles.helperText}>No active requests to show right now.</Text></SurfaceCard>
        ) : (
          <View style={styles.stack}>
            {priorityRequests.map((request) => (
              <Pressable
                key={request.id}
                onPress={() => router.push({ pathname: '/support-request-detail', params: { id: request.id } })}>
                <SurfaceCard>
                  <View style={styles.cardTop}>
                    <Badge label={request.status} tone={getStatusTone(request.status)} />
                    <Text style={styles.cardMeta}>{request.categoryName}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{request.title}</Text>
                  <View style={styles.cardLine}>
                    <Feather name="map-pin" size={14} color={authPalette.muted} />
                    <Text style={styles.cardBody}>{request.address || 'Address not provided'}</Text>
                  </View>
                </SurfaceCard>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View>
        <SectionHeader title="Community finance" />
        <Pressable onPress={() => router.push('/(tabs)/funds' as never)}>
          <SurfaceCard>
            <View style={styles.financeRow}>
              <View>
                <Text style={styles.cardMeta}>{funds.length} active fund(s)</Text>
                <Text style={styles.financeValue}>{formatCurrency(fundBalance)}</Text>
              </View>
              <Feather name="arrow-right-circle" size={26} color={authPalette.primaryDark} />
            </View>
          </SurfaceCard>
        </Pressable>
      </View>
    </DashboardScreen>
  );
}

function ActionCard({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.actionCard}>
      <Feather name={icon} size={19} color={authPalette.primaryDark} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionCard: { backgroundColor: '#F1F7F2', borderRadius: 18, flexBasis: '47%', flexGrow: 1, gap: 10, minHeight: 82, padding: 14 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionLabel: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 13 },
  cardBody: { color: authPalette.muted, flex: 1, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 19 },
  cardLine: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 12 },
  cardMeta: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 12 },
  cardTitle: { color: authPalette.text, fontFamily: Fonts.rounded, fontSize: 17, lineHeight: 23, marginTop: 12 },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  errorTitle: { color: '#AE3F3A', fontFamily: Fonts.rounded, fontSize: 16 },
  financeRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  financeValue: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 23, marginTop: 7 },
  helperText: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 21, marginTop: 6 },
  heroLabel: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 13 },
  heroTitle: { color: authPalette.text, fontFamily: Fonts.rounded, fontSize: 21, lineHeight: 29, marginTop: 8 },
  inlineLink: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 13, marginTop: 12 },
  stack: { gap: 12 },
  statsRow: { flexDirection: 'row', gap: 10 },
  welcomeText: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 13, marginTop: 12 },
});
