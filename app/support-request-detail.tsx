import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  formatDateTime,
  getSupportRequestById,
  type SupportRequestDetail,
} from '@/components/support-request/request-api';
import {
  RequestButton,
  RequestCard,
  RequestInlineLink,
  RequestMetaRow,
  RequestScreen,
  RequestSection,
  RequestStatusBadge,
} from '@/components/support-request/request-ui';
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SupportRequestDetailScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const from = getStringParam(params.from);
  const { session, user } = useAuth();
  const [requestDetail, setRequestDetail] = useState<SupportRequestDetail | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canEdit =
    requestDetail?.status === 'PENDING' &&
    user?.role === 'REQUESTER' &&
    user.id === requestDetail.requesterId;

  const backTarget = from === 'my' ? '/support-request-my' : '/(tabs)/requests';

  const loadRequestDetail = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!id) {
      setError('Missing support request id.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getSupportRequestById(session.accessToken, id);
      setRequestDetail(data);
    } catch (detailError) {
      setError(getAuthErrorMessage(detailError));
    } finally {
      setIsLoading(false);
    }
  }, [id, session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadRequestDetail();
    }, [loadRequestDetail])
  );

  return (
    <RequestScreen
      title="Request Detail"
      onBackPress={() => router.push(backTarget as never)}
      rightSlot={requestDetail ? <RequestStatusBadge status={requestDetail.status} /> : undefined}>
      {isLoading ? <Text style={styles.helperText}>Loading request detail...</Text> : null}
      {error ? (
        <RequestCard>
          <Text style={styles.emptyTitle}>Could not load request</Text>
          <Text style={styles.helperText}>{error}</Text>
          <View style={styles.retryButton}>
            <RequestButton label="Try Again" onPress={loadRequestDetail} variant="outline" />
          </View>
        </RequestCard>
      ) : null}

      {requestDetail ? (
        <>
          <RequestSection
            title="Overview"
            action={
              canEdit ? (
                <RequestInlineLink
                  label="Edit"
                  onPress={() =>
                    router.push({
                      pathname: '/support-request-edit',
                      params: { id: requestDetail.id },
                    })
                  }
                />
              ) : undefined
            }>
            <RequestCard>
              <Text style={styles.category}>{requestDetail.categoryName}</Text>
              <Text style={styles.title}>{requestDetail.title}</Text>
              <Text style={styles.description}>{requestDetail.description}</Text>

              <View style={styles.metaStack}>
                <RequestMetaRow icon="user" label="Requester" value={requestDetail.requesterName} />
                <RequestMetaRow icon="clock" label="Created At" value={formatDateTime(requestDetail.createdAt)} />
              </View>
            </RequestCard>
          </RequestSection>

          <RequestSection title="Location">
            <RequestCard>
              <View style={styles.metaStackCompact}>
                <RequestMetaRow
                  icon="map-pin"
                  label="Address"
                  value={requestDetail.address ?? 'Not provided'}
                />
                <RequestMetaRow
                  icon="navigation"
                  label="Coordinates"
                  value={
                    requestDetail.latitude != null && requestDetail.longitude != null
                      ? `${requestDetail.latitude}, ${requestDetail.longitude}`
                      : 'Not provided'
                  }
                />
              </View>
            </RequestCard>
          </RequestSection>

          <RequestSection title="Assignment">
            <RequestCard>
              <View style={styles.metaStackCompact}>
                <RequestMetaRow
                  icon="home"
                  label="Support Location"
                  value={requestDetail.assignedSupportLocationName ?? 'Not assigned yet'}
                />
                <RequestMetaRow
                  icon="check-circle"
                  label="Reviewed At"
                  value={formatDateTime(requestDetail.reviewedAt)}
                />
              </View>
            </RequestCard>
          </RequestSection>

          {requestDetail.rejectionReason ? (
            <RequestSection title="Rejection Reason">
              <RequestCard>
                <Text style={styles.description}>{requestDetail.rejectionReason}</Text>
              </RequestCard>
            </RequestSection>
          ) : null}

          <RequestSection title="Timeline">
            <RequestCard>
              <View style={styles.metaStackCompact}>
                <RequestMetaRow icon="clock" label="Created At" value={formatDateTime(requestDetail.createdAt)} />
                <RequestMetaRow icon="refresh-cw" label="Updated At" value={formatDateTime(requestDetail.updatedAt)} />
              </View>
            </RequestCard>
          </RequestSection>
        </>
      ) : null}
    </RequestScreen>
  );
}

const styles = StyleSheet.create({
  category: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  title: {
    marginTop: 8,
    fontSize: 22,
    lineHeight: 30,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  description: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  metaStack: {
    marginTop: 18,
    gap: 14,
  },
  metaStackCompact: {
    gap: 14,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 21,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  emptyTitle: {
    marginBottom: 8,
    fontSize: 16,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  retryButton: {
    marginTop: 16,
  },
});
