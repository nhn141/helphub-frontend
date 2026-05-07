import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  formatDateTime,
  getSupportRequestById,
  approveSupportRequest,
  type SupportRequestDetail,
} from '@/components/support-request/request-api';
import {
  RequestButton,
  RequestCard,
  RequestScreen,
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

  const canReview =
    requestDetail?.status === 'PENDING' &&
    (user?.role === 'ADMIN' || user?.role === 'COLLABORATOR');

  const canAssign =
    requestDetail?.status === 'APPROVED' &&
    !requestDetail.assignedSupportLocationId &&
    (user?.role === 'ADMIN' || user?.role === 'COLLABORATOR');

  const [isActioning, setIsActioning] = useState(false);

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

  const handleApprove = async () => {
    if (!session?.accessToken || !id) return;
    setIsActioning(true);
    try {
      await approveSupportRequest(session.accessToken, id);
      await loadRequestDetail();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsActioning(false);
    }
  };

  const handleReject = async () => {
    if (!session?.accessToken || !id) return;
    router.push({
      pathname: '/support-request-reject',
      params: { id },
    });
  };

  const handleAssign = async () => {
    if (!session?.accessToken || !id) return;
    router.push({
      pathname: '/support-request-assign-location',
      params: { id },
    });
  };

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
        <RequestCard>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.category}>{requestDetail.categoryName}</Text>
              <Text style={styles.title}>{requestDetail.title}</Text>
            </View>
            {canEdit && (
              <Pressable
                style={styles.editIcon}
                onPress={() =>
                  router.push({
                    pathname: '/support-request-edit',
                    params: { id: requestDetail.id },
                  })
                }>
                <Feather name="edit-2" size={16} color={authPalette.muted} />
              </Pressable>
            )}
          </View>

          {/* Requester Info */}
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {requestDetail.requesterName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>{requestDetail.requesterName}</Text>
              <Text style={styles.timeText}>{formatDateTime(requestDetail.createdAt)}</Text>
            </View>
          </View>

          {/* Content */}
          <Text style={styles.description}>{requestDetail.description}</Text>

          {/* Metadata Box (Location, Assignment) */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color={authPalette.primaryDark} />
              <Text style={styles.infoText}>{requestDetail.address || 'No address provided'}</Text>
            </View>
            {requestDetail.assignedSupportLocationName && (
              <View style={styles.infoRow}>
                <Feather name="home" size={16} color={authPalette.primaryDark} />
                <Text style={styles.infoText}>Assigned to: {requestDetail.assignedSupportLocationName}</Text>
              </View>
            )}
          </View>

          {/* Rejection Reason */}
          {requestDetail.rejectionReason && (
            <View style={styles.rejectionBox}>
              <Feather name="alert-triangle" size={16} color="#D92D20" />
              <View style={styles.rejectionContent}>
                <Text style={styles.rejectionTitle}>Rejection Reason</Text>
                <Text style={styles.rejectionText}>{requestDetail.rejectionReason}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons for Collaborators */}
          {(canReview || canAssign) && (
            <View style={styles.actionBar}>
              {canReview && (
                <>
                  <View style={styles.actionButtonContainer}>
                    <RequestButton
                      label="Approve"
                      onPress={handleApprove}
                      disabled={isActioning}
                    />
                  </View>
                  <View style={styles.actionButtonContainer}>
                    <RequestButton
                      label="Reject"
                      onPress={handleReject}
                      variant="outline"
                      disabled={isActioning}
                    />
                  </View>
                </>
              )}
              {canAssign && (
                <View style={styles.actionButtonContainer}>
                  <RequestButton
                    label="Assign to Location"
                    onPress={handleAssign}
                    disabled={isActioning}
                  />
                </View>
              )}
            </View>
          )}

          <View style={styles.divider} />

          {/* Compact Timeline */}
          <View style={styles.timelineRow}>
            <Text style={styles.timelineText}>Created: {formatDateTime(requestDetail.createdAt)}</Text>
            {requestDetail.updatedAt !== requestDetail.createdAt && (
              <Text style={styles.timelineText}> • Updated: {formatDateTime(requestDetail.updatedAt)}</Text>
            )}
            {requestDetail.reviewedAt && (
              <Text style={styles.timelineText}> • Reviewed: {formatDateTime(requestDetail.reviewedAt)}</Text>
            )}
          </View>
        </RequestCard>
      ) : null}
    </RequestScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    paddingRight: 16,
  },
  editIcon: {
    padding: 8,
    backgroundColor: '#F6FAF6',
    borderRadius: 8,
  },
  category: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontWeight: 'bold',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 15,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    marginTop: 2,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#F9FCF9',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  rejectionBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3F2',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  rejectionContent: {
    flex: 1,
  },
  rejectionTitle: {
    fontSize: 14,
    color: '#D92D20',
    fontFamily: Fonts.rounded,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#D92D20',
    fontFamily: Fonts.rounded,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F5F1',
    marginVertical: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  timelineText: {
    fontSize: 12,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
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
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButtonContainer: {
    flex: 1,
  },
});
