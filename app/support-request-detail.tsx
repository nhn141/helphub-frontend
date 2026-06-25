import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import { ShareItemSheet } from '@/components/chat/share-item-sheet';
import { UserAvatar } from '@/components/user/user-avatar';
import {
  applyToSupportRequest,
  approveVolunteerAssignment,
  cancelMyVolunteerAssignment,
  completeMyVolunteerAssignment,
  createContribution,
  createSupportNeed,
  deleteSupportNeed,
  formatDateTime,
  getContributions,
  getSupportNeeds,
  getSupportRequestById,
  approveSupportRequest,
  getMyVolunteerAssignments,
  getVolunteerAssignmentsBySupportRequest,
  rejectVolunteerAssignment,
  updateSupportNeed,
  SUPPORT_NEED_UNITS,
  SUPPORT_TYPES,
  type Contribution,
  type ContributionPayload,
  type SupportNeed,
  type SupportNeedPayload,
  type SupportNeedUnit,
  type SupportRequestDetail,
  type SupportType,
  type VolunteerAssignment,
} from '@/components/support-request/request-api';
import {
  RequestButton,
  RequestCard,
  RequestChoiceGroup,
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
  const [isShareSheetVisible, setIsShareSheetVisible] = useState(false);
  const [rejectingVolunteerId, setRejectingVolunteerId] = useState<string | null>(null);
  const [volunteerRejectionReason, setVolunteerRejectionReason] = useState('');

  // Support Needs state
  const [supportNeeds, setSupportNeeds] = useState<SupportNeed[]>([]);
  const [needsError, setNeedsError] = useState('');
  const [isNeedsLoading, setIsNeedsLoading] = useState(false);

  // Need form (add / edit inline)
  const [showNeedForm, setShowNeedForm] = useState(false);
  const [editingNeedId, setEditingNeedId] = useState<string | null>(null);
  const [needFormSupportType, setNeedFormSupportType] = useState<SupportType>('GOODS');
  const [needFormName, setNeedFormName] = useState('');
  const [needFormUnit, setNeedFormUnit] = useState<SupportNeedUnit>('PIECE');
  const [needFormQty, setNeedFormQty] = useState('');
  const [needFormError, setNeedFormError] = useState('');
  const [isSavingNeed, setIsSavingNeed] = useState(false);

  // Contributions per need
  const [contributions, setContributions] = useState<Record<string, Contribution[]>>({});
  const [expandedContribNeedId, setExpandedContribNeedId] = useState<string | null>(null);
  const [contributingNeedId, setContributingNeedId] = useState<string | null>(null);
  const [contribQty, setContribQty] = useState('');
  const [contribNote, setContribNote] = useState('');
  const [contribError, setContribError] = useState('');
  const [isContributing, setIsContributing] = useState(false);

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

  const canManageNeeds =
    Boolean(requestDetail) &&
    user?.role === 'REQUESTER' &&
    user.id === requestDetail?.requesterId;

  const canContribute =
    (requestDetail?.status === 'APPROVED' || requestDetail?.status === 'IN_PROGRESS') &&
    (
      (user?.role === 'VOLUNTEER' && myVolunteerAssignment?.status === 'ACCEPTED') ||
      user?.role === 'COLLABORATOR'
    );

  const backTarget = from === 'my' ? '/support-request-my' : '/(tabs)/support';

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

  const handleReportRequest = () => {
    if (!requestDetail) return;

    router.push({
      pathname: '/report-create' as never,
      params: {
        targetId: requestDetail.id,
        targetName: requestDetail.title,
        targetType: 'SUPPORT_REQUEST',
      },
    });
  };

  const handleReportRequester = () => {
    if (!requestDetail) return;

    router.push({
      pathname: '/report-create' as never,
      params: {
        targetId: requestDetail.requesterId,
        targetName: requestDetail.requesterName,
        targetType: 'USER',
      },
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
      pathname: '/(tabs)/social',
      params: { conversationId, view: 'chat' },
    });
  };

  const loadSupportNeeds = useCallback(async () => {
    if (!session?.accessToken || !id) return;
    setIsNeedsLoading(true);
    setNeedsError('');
    try {
      const data = await getSupportNeeds(session.accessToken, id);
      setSupportNeeds(data);
    } catch (err) {
      setNeedsError(getAuthErrorMessage(err));
    } finally {
      setIsNeedsLoading(false);
    }
  }, [id, session?.accessToken]);

  const openAddNeedForm = () => {
    setEditingNeedId(null);
    setNeedFormSupportType('GOODS');
    setNeedFormName('');
    setNeedFormUnit('PIECE');
    setNeedFormQty('');
    setNeedFormError('');
    setShowNeedForm(true);
  };

  const openEditNeedForm = (need: SupportNeed) => {
    setEditingNeedId(need.id);
    setNeedFormSupportType(need.supportType);
    setNeedFormName(need.needName);
    setNeedFormUnit(need.unit);
    setNeedFormQty(String(need.requiredQuantity));
    setNeedFormError('');
    setShowNeedForm(true);
  };

  const cancelNeedForm = () => {
    setShowNeedForm(false);
    setEditingNeedId(null);
    setNeedFormError('');
  };

  const handleSaveNeed = async () => {
    if (!session?.accessToken || !id) return;
    const qty = parseFloat(needFormQty);
    if (!needFormName.trim()) {
      setNeedFormError('Name of support needs cannot be blank.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setNeedFormError('The number must be greater than 0.');
      return;
    }
    const payload: SupportNeedPayload = {
      supportType: needFormSupportType,
      needName: needFormName.trim(),
      unit: needFormUnit,
      requiredQuantity: qty,
    };
    setIsSavingNeed(true);
    setNeedFormError('');
    try {
      if (editingNeedId) {
        await updateSupportNeed(session.accessToken, editingNeedId, payload);
      } else {
        await createSupportNeed(session.accessToken, id, payload);
      }
      setShowNeedForm(false);
      setEditingNeedId(null);
      await loadSupportNeeds();
    } catch (err) {
      setNeedFormError(getAuthErrorMessage(err));
    } finally {
      setIsSavingNeed(false);
    }
  };

  const handleDeleteNeed = async (needId: string) => {
    if (!session?.accessToken) return;
    setIsActioning(true);
    try {
      await deleteSupportNeed(session.accessToken, needId);
      await loadSupportNeeds();
    } catch (err) {
      setNeedsError(getAuthErrorMessage(err));
    } finally {
      setIsActioning(false);
    }
  };

  const toggleContributions = async (needId: string) => {
    if (expandedContribNeedId === needId) {
      setExpandedContribNeedId(null);
      return;
    }
    setExpandedContribNeedId(needId);
    if (!contributions[needId] && session?.accessToken) {
      try {
        const data = await getContributions(session.accessToken, needId);
        setContributions((prev) => ({ ...prev, [needId]: data }));
      } catch {
        setContributions((prev) => ({ ...prev, [needId]: [] }));
      }
    }
  };

  const openContribForm = (needId: string) => {
    setContributingNeedId(needId);
    setContribQty('');
    setContribNote('');
    setContribError('');
  };

  const cancelContribForm = () => {
    setContributingNeedId(null);
    setContribError('');
  };

  const handleSubmitContribution = async (needId: string) => {
    if (!session?.accessToken) return;
    const qty = parseFloat(contribQty);
    if (isNaN(qty) || qty <= 0) {
      setContribError('The number must be greater than 0.');
      return;
    }
    const payload: ContributionPayload = { quantity: qty, note: contribNote.trim() || undefined };
    setIsContributing(true);
    setContribError('');
    try {
      await createContribution(session.accessToken, needId, payload);
      setContributingNeedId(null);
      // Reload contributions if expanded
      const data = await getContributions(session.accessToken, needId);
      setContributions((prev) => ({ ...prev, [needId]: data }));
      await loadSupportNeeds();
    } catch (err) {
      setContribError(getAuthErrorMessage(err));
    } finally {
      setIsContributing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRequestDetail();
      loadSupportNeeds();
    }, [loadRequestDetail, loadSupportNeeds])
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
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/user-detail', params: { id: requestDetail.requesterId } })
            }
            style={styles.authorRow}>
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
          </Pressable>

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

          <View style={styles.shareButton}>
            <RequestButton
              label="Share to chat"
              leftIcon={<Feather name="share-2" size={15} color={authPalette.primaryDark} />}
              onPress={() => setIsShareSheetVisible(true)}
              variant="outline"
            />
          </View>

          {user?.id !== requestDetail.requesterId &&
          requestDetail.status !== 'REJECTED' &&
          requestDetail.status !== 'CANCELLED' ? (
            <View style={styles.reportActions}>
              <Pressable
                accessibilityRole="button"
                onPress={handleReportRequest}
                style={styles.reportButton}>
                <Feather name="flag" size={14} color="#AE3F3A" />
                <Text style={styles.reportButtonText}>Report request</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleReportRequester}
                style={styles.reportButton}>
                <Feather name="user-x" size={14} color="#AE3F3A" />
                <Text style={styles.reportButtonText}>Report requester</Text>
              </Pressable>
            </View>
          ) : null}

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

          {/* ── Support Needs Panel ── */}
          <View style={styles.assignmentPanel}>
            <View style={styles.assignmentPanelHeader}>
              <View style={styles.needsPanelTitle}>
                <Feather name="package" size={16} color={authPalette.primaryDark} />
                <Text style={styles.assignmentTitle}>Support needs</Text>
              </View>
              <Text style={styles.assignmentCount}>{supportNeeds.length}</Text>
            </View>

            {isNeedsLoading ? (
              <Text style={styles.assignmentText}>Loading...</Text>
            ) : needsError ? (
              <Text style={[styles.assignmentText, { color: '#AE3F3A' }]}>{needsError}</Text>
            ) : supportNeeds.length === 0 && !showNeedForm ? (
              <Text style={styles.assignmentText}>No support needs have been added yet.</Text>
            ) : null}

            {/* List of needs */}
            {supportNeeds.map((need) => {
              const pct = need.requiredQuantity > 0
                ? Math.min(need.receivedQuantity / need.requiredQuantity, 1)
                : 0;
              const pctDisplay = Math.round(pct * 100);
              const unitLabel = SUPPORT_NEED_UNITS.find((u) => u.value === need.unit)?.label ?? need.unit;
              const isExpanded = expandedContribNeedId === need.id;
              const isContribFormOpen = contributingNeedId === need.id;
              const isEditingThis = editingNeedId === need.id && showNeedForm;

              return (
                <View key={need.id} style={styles.needItem}>
                  {/* Need header row */}
                  <View style={styles.needHeaderRow}>
                    <View style={styles.needInfo}>
                      <View style={styles.needNameRow}>
                        <Text style={styles.needName}>{need.needName}</Text>
                        {need.isFulfilled && (
                          <View style={styles.fulfilledBadge}>
                            <Feather name="check" size={11} color="#1A7A4A" />
                            <Text style={styles.fulfilledText}>Đủ</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.needQtyText}>
                        {need.receivedQuantity} / {need.requiredQuantity} {unitLabel}
                      </Text>
                    </View>
                    <View style={styles.needTypeBadge}>
                      <Text style={styles.needTypeText}>
                        {SUPPORT_TYPES.find((t) => t.value === need.supportType)?.label ?? need.supportType}
                      </Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pctDisplay}%` as any, backgroundColor: need.isFulfilled ? '#22A06B' : authPalette.primaryDark }]} />
                  </View>
                  <Text style={styles.progressLabel}>{pctDisplay}%</Text>

                  {/* Inline edit form for this need */}
                  {isEditingThis ? null : (
                    <View style={styles.needActions}>
                      {/* REQUESTER: edit & delete */}
                      {canManageNeeds && (
                        <View style={styles.needActionRow}>
                          <View style={styles.needActionBtn}>
                            <RequestButton
                              label="Edit"
                              variant="outline"
                              leftIcon={<Feather name="edit-2" size={13} color={authPalette.primaryDark} />}
                              onPress={() => openEditNeedForm(need)}
                              disabled={isActioning}
                            />
                          </View>
                          <View style={styles.needActionBtn}>
                            <RequestButton
                              label="Delete"
                              variant="danger"
                              leftIcon={<Feather name="trash-2" size={13} color="#fff" />}
                              onPress={() => handleDeleteNeed(need.id)}
                              disabled={isActioning}
                            />
                          </View>
                        </View>
                      )}

                      {/* VOLUNTEER/COLLABORATOR: contribute */}
                      {canContribute && !need.isFulfilled && !isContribFormOpen && (
                        <RequestButton
                          label="Donate"
                          leftIcon={<Feather name="plus-circle" size={14} color="#fff" />}
                          onPress={() => openContribForm(need.id)}
                          disabled={isActioning}
                        />
                      )}

                      {/* Toggle contributions list */}
                      <Pressable
                        onPress={() => toggleContributions(need.id)}
                        style={styles.contribToggle}>
                        <Feather
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color={authPalette.primaryDark}
                        />
                        <Text style={styles.contribToggleText}>
                          {isExpanded ? 'Hide donations' : 'See donations'}
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Inline contribute form */}
                  {isContribFormOpen && (
                    <View style={styles.inlineForm}>
                      <Text style={styles.inlineFormTitle}>Donate to: {need.needName}</Text>
                      <RequestField
                        label={`Quantity (${unitLabel})`}
                        keyboardType="decimal-pad"
                        value={contribQty}
                        onChangeText={setContribQty}
                        placeholder="E.g.: 5"
                      />
                      <RequestField
                        label="Note (optional)"
                        multiline
                        numberOfLines={2}
                        value={contribNote}
                        onChangeText={setContribNote}
                        placeholder="E.g.: Send via post office"
                      />
                      {contribError ? (
                        <Text style={styles.formError}>{contribError}</Text>
                      ) : null}
                      <View style={styles.formActions}>
                        <View style={styles.formAction}>
                          <RequestButton
                            label="Xác nhận"
                            onPress={() => handleSubmitContribution(need.id)}
                            disabled={isContributing}
                          />
                        </View>
                        <View style={styles.formAction}>
                          <RequestButton
                            label="Cancel"
                            variant="outline"
                            onPress={cancelContribForm}
                            disabled={isContributing}
                          />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Contributions list */}
                  {isExpanded && (
                    <View style={styles.contribList}>
                      {(contributions[need.id] ?? []).length === 0 ? (
                        <Text style={styles.assignmentText}>No donations.</Text>
                      ) : (
                        (contributions[need.id] ?? []).map((c) => (
                          <View key={c.id} style={styles.contribItem}>
                            <View style={styles.contribItemTop}>
                              <Feather name="user" size={13} color={authPalette.primaryDark} />
                              <Text style={styles.contribName}>{c.contributorName}</Text>
                              <Text style={styles.contribQty}>+{c.quantity} {unitLabel}</Text>
                            </View>
                            {c.note ? (
                              <Text style={styles.contribNote}>{c.note}</Text>
                            ) : null}
                            <Text style={styles.contribDate}>{formatDateTime(c.createdAt)}</Text>
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </View>
              );
            })}

            {/* Inline edit form (add or edit need) shown below list */}
            {showNeedForm && (
              <View style={styles.inlineForm}>
                <Text style={styles.inlineFormTitle}>
                  {editingNeedId ? 'Edit support needs' : 'Add support needs'}
                </Text>
                <RequestChoiceGroup
                  label="Type of support"
                  options={SUPPORT_TYPES.map((t) => ({ label: t.label, value: t.value }))}
                  value={needFormSupportType}
                  onChange={(v) => setNeedFormSupportType(v as SupportType)}
                />
                <RequestField
                  label="Support needs' name"
                  value={needFormName}
                  onChangeText={setNeedFormName}
                  placeholder="E.g.: Rice, Cash..."
                />
                <RequestChoiceGroup
                  label="Unit"
                  options={SUPPORT_NEED_UNITS.map((u) => ({ label: u.label, value: u.value }))}
                  value={needFormUnit}
                  onChange={(v) => setNeedFormUnit(v as SupportNeedUnit)}
                />
                <RequestField
                  label="Number of needs"
                  keyboardType="decimal-pad"
                  value={needFormQty}
                  onChangeText={setNeedFormQty}
                  placeholder="E.g.: 10"
                />
                {needFormError ? (
                  <Text style={styles.formError}>{needFormError}</Text>
                ) : null}
                <View style={styles.formActions}>
                  <View style={styles.formAction}>
                    <RequestButton
                      label={editingNeedId ? 'Save changes' : 'Add'}
                      onPress={handleSaveNeed}
                      disabled={isSavingNeed}
                    />
                  </View>
                  <View style={styles.formAction}>
                    <RequestButton
                      label="Cancel"
                      variant="outline"
                      onPress={cancelNeedForm}
                      disabled={isSavingNeed}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Add need button — REQUESTER only */}
            {canManageNeeds && !showNeedForm && (
              <RequestButton
                label="+ Add support needs"
                variant="outline"
                onPress={openAddNeedForm}
              />
            )}
          </View>

        </RequestCard>
      ) : null}

      {requestDetail ? (
        <ShareItemSheet
          itemId={requestDetail.id}
          itemTitle={requestDetail.title}
          itemType="SUPPORT"
          onClose={() => setIsShareSheetVisible(false)}
          visible={isShareSheetVisible}
        />
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
  reportActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  reportButton: {
    alignItems: 'center',
    borderColor: '#F2C5C2',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 11,
  },
  reportButtonText: {
    color: '#AE3F3A',
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  shareButton: {
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
    fontSize: 15,
    fontWeight: 'bold',
  },
  assignmentMeta: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
  // ── Support Needs ──
  needsPanelTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  needItem: {
    borderColor: '#E1EAE4',
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  needHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  needInfo: {
    flex: 1,
    gap: 2,
  },
  needNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  needName: {
    fontSize: 15,
    fontFamily: Fonts.rounded,
    fontWeight: 'bold',
    color: authPalette.text,
  },
  needQtyText: {
    fontSize: 13,
    fontFamily: Fonts.rounded,
    color: authPalette.muted,
  },
  needTypeBadge: {
    backgroundColor: '#EEF7F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  needTypeText: {
    fontSize: 11,
    fontFamily: Fonts.rounded,
    color: authPalette.primaryDark,
    fontWeight: '600',
  },
  fulfilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  fulfilledText: {
    fontSize: 11,
    fontFamily: Fonts.rounded,
    color: '#1A7A4A',
    fontWeight: '600',
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#E6EEE8',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 7,
    borderRadius: 999,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: Fonts.rounded,
    color: authPalette.muted,
    textAlign: 'right',
  },
  needActions: {
    gap: 8,
  },
  needActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  needActionBtn: {
    flex: 1,
  },
  contribToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  contribToggleText: {
    fontSize: 13,
    fontFamily: Fonts.rounded,
    color: authPalette.primaryDark,
  },
  contribList: {
    borderTopWidth: 1,
    borderTopColor: '#EEF2EF',
    paddingTop: 10,
    gap: 8,
  },
  contribItem: {
    gap: 3,
  },
  contribItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contribName: {
    fontSize: 13,
    fontFamily: Fonts.rounded,
    fontWeight: 'bold',
    color: authPalette.text,
    flex: 1,
  },
  contribQty: {
    fontSize: 13,
    fontFamily: Fonts.rounded,
    color: authPalette.primaryDark,
    fontWeight: '600',
  },
  contribNote: {
    fontSize: 12,
    fontFamily: Fonts.rounded,
    color: authPalette.muted,
    paddingLeft: 19,
  },
  contribDate: {
    fontSize: 11,
    fontFamily: Fonts.rounded,
    color: '#AABDB0',
    paddingLeft: 19,
  },
  inlineForm: {
    backgroundColor: '#F4FAF6',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D6EADc',
    padding: 14,
    gap: 12,
  },
  inlineFormTitle: {
    fontSize: 14,
    fontFamily: Fonts.rounded,
    fontWeight: '600',
    color: authPalette.primaryDark,
  },
  formError: {
    fontSize: 13,
    fontFamily: Fonts.rounded,
    color: '#AE3F3A',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
  },
  formAction: {
    flex: 1,
  },
  rejectForm: {
    gap: 12,
  },
});
