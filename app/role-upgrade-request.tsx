import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementField,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import {
  createMyRoleUpgradeRequest,
  formatRoleUpgradeDateTime,
  getMyRoleUpgradeRequests,
  getRoleUpgradeStatusTone,
  type RoleUpgradeRequest,
} from '@/components/role-upgrade/role-upgrade-api';
import { useToast } from '@/components/ui/toast';
import { Fonts } from '@/constants/theme';

export default function RoleUpgradeRequestScreen() {
  const { isLoading: isAuthLoading, refreshSession, session, user } = useAuth();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<RoleUpgradeRequest[]>([]);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const didRefreshApprovedProfile = useRef(false);

  const pendingRequest = useMemo(
    () => requests.find((request) => request.status === 'PENDING') ?? null,
    [requests]
  );
  const isVolunteer = user?.role === 'VOLUNTEER';
  const latestRequest = requests[0];

  const loadRequests = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getMyRoleUpgradeRequests(session.accessToken, {
        page: 0,
        size: 20,
      });

      setRequests(data.content);

      if (
        !didRefreshApprovedProfile.current &&
        data.content.some((request) => request.status === 'APPROVED')
      ) {
        didRefreshApprovedProfile.current = true;
        await refreshSession();
      }
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLoading, refreshSession, session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  async function handleSubmit() {
    const trimmedReason = reason.trim();

    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!isVolunteer) {
      const message = 'Only volunteers can request collaborator access.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    if (pendingRequest) {
      const message = 'You already have a pending role upgrade request.';
      setError(message);
      showToast({ message, type: 'info' });
      return;
    }

    if (!trimmedReason) {
      const message = 'Reason is required.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const created = await createMyRoleUpgradeRequest(session.accessToken, {
        reason: trimmedReason,
      });
      setRequests((current) => [created, ...current]);
      setReason('');
      showToast({ message: 'Role upgrade request submitted.', type: 'success' });
    } catch (submitError) {
      const message = getAuthErrorMessage(submitError);
      setError(message);
      showToast({ message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ManagementScreen
      title="Role Upgrade"
      onBackPress={() => router.push('/(tabs)/profile')}
      rightSlot={
        latestRequest ? (
          <ManagementBadge
            label={latestRequest.status}
            tone={getRoleUpgradeStatusTone(latestRequest.status)}
          />
        ) : (
          <ManagementBadge label={user?.role ?? 'VOLUNTEER'} tone="slate" />
        )
      }>
      {isLoading ? <Text style={styles.helperText}>Loading role upgrade requests...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ManagementSection title="Current Role">
        <ManagementCard>
          <View style={styles.metaStack}>
            <ManagementMetaRow icon="user" label="Name" value={user?.fullName ?? 'Not available'} />
            <ManagementMetaRow icon="mail" label="Email" value={user?.email ?? 'Not available'} />
            <ManagementMetaRow
              icon="shield"
              label="Role"
              value={user?.role ?? 'Not available'}
            />
          </View>
        </ManagementCard>
      </ManagementSection>

      {isVolunteer && !pendingRequest ? (
        <ManagementSection title="New Request">
          <ManagementCard>
            <ManagementField
              label="Reason"
              maxLength={1000}
              multiline
              numberOfLines={5}
              onChangeText={setReason}
              placeholder="Share your contribution experience and why you want collaborator access."
              value={reason}
            />
            <View style={styles.formButton}>
              <ManagementButton
                disabled={isSubmitting}
                label={isSubmitting ? 'Submitting...' : 'Submit Request'}
                leftIcon={<Feather name="send" size={16} color="#FFFFFF" />}
                onPress={handleSubmit}
              />
            </View>
          </ManagementCard>
        </ManagementSection>
      ) : null}

      {pendingRequest ? (
        <ManagementSection title="Pending Request">
          <ManagementCard>
            <View style={styles.cardTop}>
              <ManagementBadge label="PENDING" tone="amber" />
              <Text style={styles.dateText}>
                {formatRoleUpgradeDateTime(pendingRequest.createdAt)}
              </Text>
            </View>
            <Text style={styles.reasonText}>{pendingRequest.reason}</Text>
          </ManagementCard>
        </ManagementSection>
      ) : null}

      <ManagementSection title="History">
        <View style={styles.stack}>
          {requests.map((request) => (
            <ManagementCard key={request.id}>
              <View style={styles.cardTop}>
                <ManagementBadge
                  label={request.status}
                  tone={getRoleUpgradeStatusTone(request.status)}
                />
                <Text style={styles.dateText}>{formatRoleUpgradeDateTime(request.createdAt)}</Text>
              </View>
              <View style={styles.metaStackSmall}>
                <ManagementMetaRow
                  icon="shield"
                  label="Requested role"
                  value={`${request.fromRole} to ${request.toRole}`}
                />
                <ManagementMetaRow
                  icon="clock"
                  label="Reviewed at"
                  value={formatRoleUpgradeDateTime(request.reviewedAt)}
                />
                <ManagementMetaRow
                  icon="user-check"
                  label="Reviewed by"
                  value={request.reviewedByName ?? 'Not available'}
                />
              </View>
              <Text style={styles.reasonText}>{request.reason}</Text>
              {request.rejectionReason ? (
                <Text style={styles.rejectionText}>{request.rejectionReason}</Text>
              ) : null}
            </ManagementCard>
          ))}

          {!isLoading && requests.length === 0 ? (
            <ManagementCard>
              <View style={styles.emptyState}>
                <Feather name="inbox" size={30} color="#AEBAB0" />
                <Text style={styles.emptyTitle}>No role upgrade requests</Text>
              </View>
            </ManagementCard>
          ) : null}
        </View>
      </ManagementSection>
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  metaStack: {
    gap: 14,
  },
  metaStackSmall: {
    gap: 12,
    marginTop: 14,
  },
  formButton: {
    marginTop: 16,
  },
  stack: {
    gap: 12,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  dateText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  reasonText: {
    backgroundColor: '#F3F8F4',
    borderRadius: 8,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
    padding: 11,
  },
  rejectionText: {
    backgroundColor: '#FDE7E6',
    borderRadius: 8,
    color: '#AE3F3A',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
    padding: 10,
  },
  helperText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 21,
  },
  errorText: {
    backgroundColor: '#FDE7E6',
    borderRadius: 8,
    color: '#AE3F3A',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 19,
    padding: 11,
  },
  emptyState: {
    alignItems: 'center',
    gap: 9,
    paddingVertical: 28,
  },
  emptyTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },
});
