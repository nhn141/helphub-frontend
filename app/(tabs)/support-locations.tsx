import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import { Badge, DashboardScreen, FilterChip, SectionHeader, StatCard, SurfaceCard } from '@/components/dashboard/tab-ui';
import { SectionTabs } from '@/components/dashboard/section-tabs';
import { useDemoRole } from '@/components/demo-role/demo-role-provider';
import {
  formatCoordinate,
  formatLocationDateTime,
  getSupportLocations,
  type SupportLocationSummary,
} from '@/components/management/support-location-api';
import { canManageSupportLocations } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

const filters: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

export default function SupportLocationsTabScreen() {
  const { session, isAuthenticated } = useAuth();
  const { role } = useDemoRole();
  const canManageLocations = canManageSupportLocations(role);
  const [locations, setLocations] = useState<SupportLocationSummary[]>([]);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('ALL');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredLocations = useMemo(
    () =>
      locations.filter((item) => {
        if (activeFilter === 'ACTIVE') {
          return item.isActive;
        }

        if (activeFilter === 'INACTIVE') {
          return !item.isActive;
        }

        return true;
      }),
    [activeFilter, locations]
  );

  const locationStats = useMemo(
    () => [
      { label: 'Locations', value: locations.length.toString().padStart(2, '0'), tone: 'green' as const },
      {
        label: 'Active',
        value: locations.filter((item) => item.isActive).length.toString().padStart(2, '0'),
        tone: 'mint' as const,
      },
      {
        label: 'Inactive',
        value: locations.filter((item) => !item.isActive).length.toString().padStart(2, '0'),
        tone: 'slate' as const,
      },
    ],
    [locations]
  );

  const loadLocations = useCallback(async () => {
    if (!session?.accessToken || !canManageLocations) {
      setLocations([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getSupportLocations(session.accessToken, false);
      setLocations(data);
    } catch (locationError) {
      setError(getAuthErrorMessage(locationError));
    } finally {
      setIsLoading(false);
    }
  }, [canManageLocations, session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadLocations();
    }, [loadLocations])
  );

  if (!canManageLocations) {
    return (
      <DashboardScreen title="Support Locations">
        <SurfaceCard>
          <Text style={styles.restrictedTitle}>Admin or collaborator only</Text>
          <Text style={styles.restrictedBody}>
            Support location management is available for users who coordinate request assignment.
          </Text>
        </SurfaceCard>
      </DashboardScreen>
    );
  }

  return (
    <DashboardScreen title="Request">
      <SectionTabs
        items={[
          {
            icon: 'clipboard',
            label: 'Requests',
            onPress: () => router.push({ pathname: '/(tabs)/support', params: { view: 'requests' } }),
          },
          {
            active: true,
            icon: 'map-pin',
            label: 'Locations',
            onPress: () => router.push({ pathname: '/(tabs)/support', params: { view: 'locations' } }),
          },
        ]}
      />

      {!isAuthenticated ? (
        <SurfaceCard>
          <Text style={styles.emptyTitle}>Login required</Text>
          <Text style={styles.emptyText}>Please log in to manage support locations.</Text>
          <Text style={styles.openDetail} onPress={() => router.replace('/login' as never)}>
            Back to Login
          </Text>
        </SurfaceCard>
      ) : (
        <>
          <View style={styles.statsRow}>
            {locationStats.map((item) => (
              <StatCard key={item.label} label={item.label} tone={item.tone} value={item.value} />
            ))}
          </View>

          <View>
            <SectionHeader
              title="Filters"
              action={
                <Text style={styles.headerAction} onPress={loadLocations}>
                  Refresh
                </Text>
              }
            />
            <SurfaceCard>
              <View style={styles.filterRow}>
                {filters.map((item) => (
                  <FilterChip
                    key={item.value}
                    active={activeFilter === item.value}
                    label={item.label}
                    onPress={() => setActiveFilter(item.value)}
                  />
                ))}
              </View>
            </SurfaceCard>
          </View>

          <View>
            <SectionHeader
              title="Location Directory"
              action={
                <Pressable accessibilityRole="button" onPress={() => router.push('/support-location-create')}>
                  <Text style={styles.headerAction}>New Location</Text>
                </Pressable>
              }
            />

            {isLoading ? <Text style={styles.helperText}>Loading support locations...</Text> : null}

            {error ? (
              <SurfaceCard>
                <Text style={styles.emptyTitle}>Could not load locations</Text>
                <Text style={styles.emptyText}>{error}</Text>
                <Text style={styles.openDetail} onPress={loadLocations}>
                  Try again
                </Text>
              </SurfaceCard>
            ) : null}

            {!isLoading && !error && filteredLocations.length === 0 ? (
              <SurfaceCard>
                <Text style={styles.emptyTitle}>No locations found</Text>
                <Text style={styles.emptyText}>Create a support location or choose another filter.</Text>
              </SurfaceCard>
            ) : null}

            <View style={styles.stack}>
              {filteredLocations.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/support-location-detail',
                      params: { id: item.id },
                    })
                  }>
                  <SurfaceCard>
                    <View style={styles.cardTop}>
                      <Badge
                        label={item.isActive ? 'ACTIVE' : 'INACTIVE'}
                        tone={item.isActive ? 'green' : 'slate'}
                      />
                      <Text style={styles.cardMeta}>{formatLocationDateTime(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={styles.cardMetaRow}>
                      <Feather name="map-pin" size={14} color={authPalette.muted} />
                      <Text style={styles.cardBody}>{item.address}</Text>
                    </View>
                    <View style={styles.cardMetaRow}>
                      <Feather name="phone" size={14} color={authPalette.muted} />
                      <Text style={styles.cardBody}>{item.contactPhone ?? 'No contact phone'}</Text>
                    </View>
                    <View style={styles.cardMetaRow}>
                      <Feather name="navigation" size={14} color={authPalette.muted} />
                      <Text style={styles.cardBody}>
                        {formatCoordinate(item.latitude)}, {formatCoordinate(item.longitude)}
                      </Text>
                    </View>
                    <Text style={styles.openDetail}>Open detail</Text>
                  </SurfaceCard>
                </Pressable>
              ))}
            </View>
          </View>
        </>
      )}
    </DashboardScreen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stack: {
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerAction: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
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
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
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
  helperText: {
    fontSize: 14,
    lineHeight: 21,
    color: authPalette.muted,
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
  restrictedTitle: {
    fontSize: 20,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  restrictedBody: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
});
