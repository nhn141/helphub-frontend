import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import { UserAvatar } from '@/components/user/user-avatar';
import {
  applyToSupportRequest,
  approveVolunteerAssignment,
  cancelMyVolunteerAssignment,
  completeMyVolunteerAssignment,
  formatDateTime,
  getSupportRequestById,
  approveSupportRequest,
  getMyVolunteerAssignments,
  getVolunteerAssignmentsBySupportRequest,
  rejectVolunteerAssignment,
  type SupportRequestDetail,
  type VolunteerAssignment,
} from '@/components/support-request/request-api';
import {
  RequestButton,
  RequestCard,
  RequestField,
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
  const [volunteerAssignments, setVolunteerAssignments] = useState<VolunteerAssignment[]>([]);
  const [myVolunteerAssignment, setMyVolunteerAssignment] = useState<VolunteerAssignment | null>(null);
  const [error, setError] = useState('');
  const [assignmentError, setAssignmentError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rejectingVolunteerId, setRejectingVolunteerId] = useState<string | null>(null);
  const [volunteerRejectionReason, setVolunteerRejectionReason] = useState('');

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

  const canViewVolunteerAssignments =
    Boolean(requestDetail) &&
    (user?.role === 'ADMIN' ||
      user?.role === 'COLLABORATOR' ||
      user?.id === requestDetail?.requesterId);

  const canReviewVolunteerAssignments =
    Boolean(requestDetail) &&
    (user?.role === 'ADMIN' ||
      user?.role === 'COLLABORATOR' ||
      user?.id === requestDetail?.requesterId);

  const canApplyAsVolunteer =
    requestDetail &&
    user?.role === 'VOLUNTEER' &&
    user.id !== requestDetail.requesterId &&
    (requestDetail.status === 'APPROVED' || requestDetail.status === 'IN_PROGRESS') &&
    !myVolunteerAssignment;

  const [isActioning, setIsActioning] = useState(false);

  const backTarget = from === 'my' ? '/support-request-my' : '/(tabs)/requests';

  const loadRequestDetail = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!id) {
      setError('Missing support request.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getSupportRequestById(session.accessToken, id);
      setRequestDetail(data);
      setAssignmentError('');
    } catch (detailError) {
      setError(getAuthErrorMessage(detailError));
    } finally {
      setIsLoading(false);
    }
  }, [id, session?.accessToken]);

  const loadVolunteerAssignmentState = useCallback(async () => {
    if (!session?.accessToken || !id || !requestDetail || !user) {
      setVolunteerAssignments([]);
      setMyVolunteerAssignment(null);
      return;
    }

    setAssignmentError('');

    const shouldLoadRequestAssignments =
      user.role === 'ADMIN' ||
      user.role === 'COLLABORATOR' ||
      user.id === requestDetail.requesterId;

    if (shouldLoadRequestAssignments) {
      try {
        const assignments = await getVolunteerAssignmentsBySupportRequest(session.accessToken, id);
        setVolunteerAssignments(assignments);
      } catch (assignmentLoadError) {
        setVolunteerAssignments([]);
        setAssignmentError(getAuthErrorMessage(assignmentLoadError));
      }
    } else {
      setVolunteerAssignments([]);
    }

    if (user.role === 'VOLUNTEER') {
      try {
        const myAssignments = await getMyVolunteerAssignments(session.accessToken);
        setMyVolunteerAssignment(
          myAssignments.find((assignment) => assignment.supportRequestId === id) ?? null
        );
      } catch (assignmentLoadError) {
        setMyVolunteerAssignment(null);
        setAssignmentError(getAuthErrorMessage(assignmentLoadError));
      }
    } else {
      setMyVolunteerAssignment(null);
    }
  }, [id, requestDetail, session?.accessToken, user]);

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

  const handleApplyAsVolunteer = async () => {
    if (!session?.accessToken || !id) return;

    setIsActioning(true);
    setAssignmentError('');

    try {
      await applyToSupportRequest(session.accessToken, id);
      await loadRequestDetail();
    } catch (applyError) {
      setAssignmentError(getAuthErrorMessage(applyError));
    } finally {
      setIsActioning(false);
    }
  };

  const handleCancelMyAssignment = async () => {
    if (!session?.accessToken || !id) return;

    setIsActioning(true);
    setAssignmentError('');

    try {
      await cancelMyVolunteerAssignment(session.accessToken, id);
      await loadRequestDetail();
    } catch (cancelError) {
      setAssignmentError(getAuthErrorMessage(cancelError));
    } finally {
      setIsActioning(false);
    }
  };

  const handleCompleteMyAssignment = async () => {
    if (!session?.accessToken || !id) return;

    setIsActioning(true);
    setAssignmentError('');

    try {
      await completeMyVolunteerAssignment(session.accessToken, id);
      await loadRequestDetail();
    } catch (completeError) {
      setAssignmentError(getAuthErrorMessage(completeError));
    } finally {
      setIsActioning(false);
    }
  };

  const handleApproveVolunteer = async (volunteerId: string) => {
    if (!session?.accessToken || !id) return;

    setIsActioning(true);
    setAssignmentError('');

    try {
      await approveVolunteerAssignment(session.accessToken, id, volunteerId);
      await loadRequestDetail();
    } catch (approveError) {
      setAssignmentError(getAuthErrorMessage(approveError));
    } finally {
      setIsActioning(false);
    }
  };

  const handleRejectVolunteer = async (volunteerId: string) => {
    if (!session?.accessToken || !id) return;

    const reason = volunteerRejectionReason.trim();

    if (!reason) {
      setAssignmentError('Rejection reason is required.');
      return;
    }

    setIsActioning(true);
    setAssignmentError('');

    try {
      await rejectVolunteerAssignment(session.accessToken, id, volunteerId, reason);
      setRejectingVolunteerId(null);
      setVolunteerRejectionReason('');
      await loadRequestDetail();
    } catch (rejectError) {
      setAssignmentError(getAuthErrorMessage(rejectError));
    } finally {
      setIsActioning(false);
    }
  };

  const handleOpenConversation = (conversationId: string) => {
    router.push({
      pathname: '/(tabs)/chat',
      params: { conversationId },
    });
  };

  useFocusEffect(
    useCallback(() => {
      loadRequestDetail();
    }, [loadRequestDetail])
  );

  useEffect(() => {
    loadVolunteerAssignmentState();
  }, [loadVolunteerAssignmentState]);

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
            <UserAvatar
              name={requestDetail.requesterName}
              size={40}
              style={styles.avatar}
              textSize={16}
              uri={requestDetail.requesterAvatarUrl}
            />
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

          {assignmentError ? (
            <View style={styles.assignmentError}>
              <Feather name="alert-circle" size={15} color="#AE3F3A" />
              <Text style={styles.assignmentErrorText}>{assignmentError}</Text>
            </View>
          ) : null}

          {(canApplyAsVolunteer || myVolunteerAssignment) && (
            <View style={styles.assignmentPanel}>
              <View style={styles.assignmentPanelHeader}>
                <Text style={styles.assignmentTitle}>Volunteer assignment</Text>
                {myVolunteerAssignment ? (
                  <RequestStatusBadge status={myVolunteerAssignment.status} />
                ) : null}
              </View>

              {myVolunteerAssignment ? (
                <>
                  <Text style={styles.assignmentText}>
                    {myVolunteerAssignment.status === 'PENDING'
                      ? 'Your application is waiting for review.'
                      : myVolunteerAssignment.status === 'ACCEPTED'
                        ? 'You have been accepted for this request.'
                        : myVolunteerAssignment.status === 'REJECTED'
                          ? myVolunteerAssignment.rejectionReason ?? 'Your application was rejected.'
                          : myVolunteerAssignment.status === 'COMPLETED'
                            ? 'You marked this support assignment as completed.'
                            : 'This volunteer assignment was cancelled.'}
                  </Text>
                  <View style={styles.assignmentActionRow}>
                    {myVolunteerAssignment.conversationId ? (
                      <View style={styles.assignmentAction}>
                        <RequestButton
                          label="Open Chat"
                          onPress={() =>
                            myVolunteerAssignment.conversationId &&
                            handleOpenConversation(myVolunteerAssignment.conversationId)
                          }
                          variant="outline"
                        />
                      </View>
                    ) : null}
                    {myVolunteerAssignment.status === 'PENDING' ||
                    myVolunteerAssignment.status === 'ACCEPTED' ? (
                      <View style={styles.assignmentAction}>
                        <RequestButton
                          label="Cancel"
                          onPress={handleCancelMyAssignment}
                          variant="outline"
                          disabled={isActioning}
                        />
                      </View>
                    ) : null}
                    {myVolunteerAssignment.status === 'ACCEPTED' ? (
                      <View style={styles.assignmentAction}>
                        <RequestButton
                          label="Complete"
                          onPress={handleCompleteMyAssignment}
                          disabled={isActioning}
                        />
                      </View>
                    ) : null}
                  </View>
                </>
              ) : (
                <RequestButton
                  label="Apply to Support"
                  onPress={handleApplyAsVolunteer}
                  disabled={isActioning}
                />
              )}
            </View>
          )}

          {canViewVolunteerAssignments ? (
            <View style={styles.assignmentPanel}>
              <View style={styles.assignmentPanelHeader}>
                <Text style={styles.assignmentTitle}>Volunteer applications</Text>
                <Text style={styles.assignmentCount}>{volunteerAssignments.length}</Text>
              </View>

              {volunteerAssignments.length === 0 ? (
                <Text style={styles.assignmentText}>No volunteer applications yet.</Text>
              ) : (
                <View style={styles.assignmentList}>
                  {volunteerAssignments.map((assignment) => (
                    <View key={assignment.volunteerId} style={styles.assignmentItem}>
                      <View style={styles.assignmentItemTop}>
                        <View style={styles.assignmentItemText}>
                          <Text style={styles.assignmentName}>{assignment.volunteerName}</Text>
                          <Text style={styles.assignmentMeta} numberOfLines={1}>
                            {assignment.volunteerEmail}
                          </Text>
                          {assignment.volunteerPhone ? (
                            <Text style={styles.assignmentMeta}>{assignment.volunteerPhone}</Text>
                          ) : null}
                        </View>
                        <RequestStatusBadge status={assignment.status} />
                      </View>

                      {assignment.rejectionReason ? (
                        <Text style={styles.assignmentText}>{assignment.rejectionReason}</Text>
                      ) : null}

                      {assignment.conversationId ? (
                        <View style={styles.assignmentActionRow}>
                          <View style={styles.assignmentAction}>
                            <RequestButton
                              label="Open Chat"
                              onPress={() =>
                                assignment.conversationId &&
                                handleOpenConversation(assignment.conversationId)
                              }
                              variant="outline"
                            />
                          </View>
                        </View>
                      ) : null}

                      {canReviewVolunteerAssignments && assignment.status === 'PENDING' ? (
                        <View style={styles.assignmentActionRow}>
                          <View style={styles.assignmentAction}>
                            <RequestButton
                              label="Approve"
                              onPress={() => handleApproveVolunteer(assignment.volunteerId)}
                              disabled={isActioning}
                            />
                          </View>
                          <View style={styles.assignmentAction}>
                            <RequestButton
                              label={
                                rejectingVolunteerId === assignment.volunteerId
                                  ? 'Cancel Reject'
                                  : 'Reject'
                              }
                              onPress={() => {
                                if (rejectingVolunteerId === assignment.volunteerId) {
                                  setRejectingVolunteerId(null);
                                  setVolunteerRejectionReason('');
                                  return;
                                }

                                setRejectingVolunteerId(assignment.volunteerId);
                                setVolunteerRejectionReason('');
                              }}
                              variant="outline"
                              disabled={isActioning}
                            />
                          </View>
                        </View>
                      ) : null}

                      {rejectingVolunteerId === assignment.volunteerId ? (
                        <View style={styles.rejectForm}>
                          <RequestField
                            label="Rejection reason"
                            multiline
                            numberOfLines={3}
                            onChangeText={setVolunteerRejectionReason}
                            placeholder="Explain why this volunteer is not selected"
                            value={volunteerRejectionReason}
                          />
                          <RequestButton
                            label="Confirm Reject"
                            onPress={() => handleRejectVolunteer(assignment.volunteerId)}
                            variant="danger"
                            disabled={isActioning}
                          />
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null}

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
  assignmentError: {
    alignItems: 'center',
    backgroundColor: '#FDE7E6',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  assignmentErrorText: {
    color: '#AE3F3A',
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
  },
  assignmentPanel: {
    borderColor: '#E1EAE4',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginTop: 16,
    padding: 14,
  },
  assignmentPanelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  assignmentTitle: {
    color: authPalette.text,
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
  assignmentCount: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
  assignmentText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 19,
  },
  assignmentActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  assignmentAction: {
    flexGrow: 1,
    minWidth: 120,
  },
  assignmentList: {
    gap: 12,
  },
  assignmentItem: {
    borderColor: '#E8EFEA',
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  assignmentItemTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  assignmentItemText: {
    flex: 1,
    minWidth: 0,
  },
  assignmentName: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 14,
  },
  assignmentMeta: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
    marginTop: 3,
  },
  rejectForm: {
    gap: 12,
  },
});
