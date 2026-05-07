import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  formatDateTime,
  getMySupportRequests,
  type SupportRequestStatus,
  type SupportRequestSummary,
} from '@/components/support-request/request-api';
import {
  RequestButton,
  RequestCard,
  RequestMetaRow,
  RequestScreen,
  RequestSection,
  RequestStatusBadge,
} from '@/components/support-request/request-ui';
import { Fonts } from '@/constants/theme';

const filters: { label: string; value?: SupportRequestStatus }[] = [
  { label: 'All' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export default function SupportRequestMyScreen() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<SupportRequestSummary[]>([]);
  const [activeStatus, setActiveStatus] = useState<SupportRequestStatus | undefined>();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredRequests = useMemo(
    () => requests.filter((item) => !activeStatus || item.status === activeStatus),
    [activeStatus, requests]
  );

  const loadMyRequests = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getMySupportRequests(session.accessToken);
      setRequests(data);
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadMyRequests();
    }, [loadMyRequests])
  );

  return (
    <RequestScreen title="My Requests" onBackPress={() => router.push('/(tabs)/requests')}>
      <RequestSection title="Filters">
        <View style={styles.filterRow}>
          {filters.map((item) => {
            const active = activeStatus === item.value;

            return (
              <Pressable
                key={item.label}
                accessibilityRole="button"
                onPress={() => setActiveStatus(item.value)}
                style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </RequestSection>

      <RequestSection
        title="Request List"
        action={
          <Text style={styles.reloadText} onPress={loadMyRequests}>
            Refresh
          </Text>
        }>
        {isLoading ? <Text style={styles.helperText}>Loading your requests...</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {!isLoading && !error && filteredRequests.length === 0 ? (
          <RequestCard>
            <Text style={styles.emptyTitle}>No requests found</Text>
            <Text style={styles.helperText}>Create a new support request or choose another filter.</Text>
          </RequestCard>
        ) : null}

        <View style={styles.stack}>
          {filteredRequests.map((item) => (
            <RequestCard key={item.id}>
              <View style={styles.cardTop}>
                <RequestStatusBadge status={item.status} />
                <Text style={styles.category}>{item.categoryName}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.metaStack}>
                <RequestMetaRow icon="map-pin" label="Address" value={item.address ?? 'Not provided'} />
                <RequestMetaRow icon="clock" label="Created At" value={formatDateTime(item.createdAt)} />
              </View>
              <View style={styles.buttonRow}>
                <View style={styles.buttonCell}>
                  <RequestButton
                    label="View Detail"
                    onPress={() =>
                      router.push({
                        pathname: '/support-request-detail',
                        params: { id: item.id, from: 'my' },
                      })
                    }
                    variant="outline"
                  />
                </View>
                <View style={styles.buttonCell}>
                  <RequestButton
                    disabled={item.status !== 'PENDING'}
                    label={item.status === 'PENDING' ? 'Edit' : 'Locked'}
                    onPress={() =>
                      router.push({
                        pathname: '/support-request-edit',
                        params: { id: item.id },
                      })
                    }
                  />
                </View>
              </View>
            </RequestCard>
          ))}
        </View>
      </RequestSection>
    </RequestScreen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    borderRadius: 999,
    backgroundColor: '#ECF2EC',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: authPalette.primaryDark,
  },
  filterText: {
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  filterTextActive: {
    color: '#FFFFFF',
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
  category: {
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  title: {
    marginTop: 12,
    fontSize: 18,
    lineHeight: 25,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  metaStack: {
    marginTop: 16,
    gap: 12,
  },
  buttonRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12,
  },
  buttonCell: {
    flex: 1,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 21,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.rounded,
  },
  emptyTitle: {
    marginBottom: 8,
    fontSize: 16,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  reloadText: {
    fontSize: 14,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
});
