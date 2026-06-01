import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Badge,
  DashboardScreen,
  FilterChip,
  SectionHeader,
  StatCard,
  SurfaceCard,
} from '@/components/dashboard/tab-ui';
import { SectionTabs } from '@/components/dashboard/section-tabs';
import { authPalette } from '@/components/auth/auth-ui';
import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { useDemoRole } from '@/components/demo-role/demo-role-provider';
import { UserAvatar } from '@/components/user/user-avatar';
import {
  getStatusTone,
  getSupportRequests,
  type SupportRequestStatus,
  type SupportRequestSummary,
} from '@/components/support-request/request-api';
import { canCreateRequests, canManageSupportLocations, getRoleTone } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

const statusFilters: { label: string; value?: SupportRequestStatus }[] = [
  { label: 'All Requests' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Rejected', value: 'REJECTED' },
];

function countByStatus(requests: SupportRequestSummary[], status: SupportRequestStatus) {
  return requests.filter((item) => item.status === status).length.toString().padStart(2, '0');
}

export default function RequestsTabScreen() {
  const { session, isAuthenticated } = useAuth();
  const { role } = useDemoRole();
  const showRequesterActions = canCreateRequests(role);
  const showSupportTabs = canManageSupportLocations(role);
  const [requests, setRequests] = useState<SupportRequestSummary[]>([]);
  const [activeStatus, setActiveStatus] = useState<SupportRequestStatus | undefined>();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const requestStats = useMemo(
    () => [
      { label: 'Pending', value: countByStatus(requests, 'PENDING'), tone: 'amber' as const },
      { label: 'Approved', value: countByStatus(requests, 'APPROVED'), tone: 'green' as const },
      { label: 'In progress', value: countByStatus(requests, 'IN_PROGRESS'), tone: 'mint' as const },
    ],
    [requests]
  );

  const loadRequests = useCallback(async () => {
    if (!session?.accessToken) {
      setRequests([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getSupportRequests(session.accessToken, activeStatus);
      setRequests(data);
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [activeStatus, session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  return (
    <DashboardScreen
      title={showSupportTabs ? 'Support' : 'Support Requests'}
      rightSlot={<Badge label={role} tone={getRoleTone(role)} />}>
      {showSupportTabs ? (
        <SectionTabs
          items={[
            {
              active: true,
              icon: 'clipboard',
              label: 'Requests',
              onPress: () => router.push({ pathname: '/(tabs)/support', params: { view: 'requests' } }),
            },
            {
              icon: 'map-pin',
              label: 'Locations',
              onPress: () => router.push({ pathname: '/(tabs)/support', params: { view: 'locations' } }),
            },
          ]}
        />
      ) : null}

      {showRequesterActions ? (
        <View>
          <SectionHeader title="My Requests" />
          <SurfaceCard>
            <View style={styles.requesterRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/support-request-create')}
                style={styles.requesterCard}>
                <Feather name="plus-circle" size={18} color={authPalette.primaryDark} />
                <Text style={styles.requesterTitle}>Create Request</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/support-request-my')}
                style={styles.requesterCard}>
                <Feather name="folder" size={18} color={authPalette.primaryDark} />
                <Text style={styles.requesterTitle}>My Requests</Text>
              </Pressable>
            </View>
          </SurfaceCard>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        {requestStats.map((item) => (
          <StatCard key={item.label} label={item.label} tone={item.tone} value={item.value} />
        ))}
      </View>

      <View>
        <SectionHeader title="Filters" />
        <SurfaceCard>
          <View style={styles.filterRow}>
            {statusFilters.map((item) => (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                onPress={() => setActiveStatus(item.value)}>
                <FilterChip active={activeStatus === item.value} label={item.label} />
              </Pressable>
            ))}
          </View>
        </SurfaceCard>
      </View>

      <View>
        <SectionHeader title="Request Feed" />

        {!isAuthenticated ? (
          <SurfaceCard>
            <Text style={styles.emptyTitle}>Login required</Text>
            <Text style={styles.emptyText}>Please log in to view live support requests.</Text>
            <Text style={styles.openDetail} onPress={() => router.replace('/login' as never)}>
              Back to Login
            </Text>
          </SurfaceCard>
        ) : error ? (
          <SurfaceCard>
            <Text style={styles.emptyTitle}>Could not load requests</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <Text style={styles.openDetail} onPress={loadRequests}>
              Try again
            </Text>
          </SurfaceCard>
        ) : isLoading ? (
          <SurfaceCard>
            <Text style={styles.emptyTitle}>Loading requests</Text>
            <Text style={styles.emptyText}>Fetching the latest support requests...</Text>
          </SurfaceCard>
        ) : requests.length === 0 ? (
          <SurfaceCard>
            <Text style={styles.emptyTitle}>No requests found</Text>
            <Text style={styles.emptyText}>Try another filter or create a new request.</Text>
          </SurfaceCard>
        ) : (
          <View style={styles.stack}>
            {requests.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/support-request-detail',
                    params: { id: item.id },
                  })
                }>
                <SurfaceCard>
                  <View style={styles.cardTop}>
                    <Badge label={item.status} tone={getStatusTone(item.status)} />
                    <Text style={styles.cardMeta}>{item.categoryName}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.requesterInfo}>
                    <UserAvatar
                      name={item.requesterName}
                      size={34}
                      style={styles.requesterAvatar}
                      textSize={13}
                      uri={item.requesterAvatarUrl}
                    />
                    <View style={styles.requesterText}>
                      <Text style={styles.requesterLabel}>Requester</Text>
                      <Text style={styles.requesterName} numberOfLines={1}>
                        {item.requesterName}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardMetaRow}>
                    <Feather name="map-pin" size={14} color={authPalette.muted} />
                    <Text style={styles.cardBody}>Address: {item.address ?? 'Not provided'}</Text>
                  </View>
                  <Text style={styles.openDetail}>Open detail</Text>
                </SurfaceCard>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </DashboardScreen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  requesterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  requesterCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#F1F7F2',
    paddingHorizontal: 14,
    paddingVertical: 18,
    gap: 10,
  },
  requesterTitle: {
    fontSize: 14,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 21,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  requesterInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  requesterAvatar: {
    backgroundColor: '#E6F4EB',
  },
  requesterText: {
    flex: 1,
    minWidth: 0,
  },
  requesterLabel: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  requesterName: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  openDetail: {
    marginTop: 14,
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  emptyTitle: {
    fontSize: 16,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
});
