import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
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
  formatReportDateTime,
  getReportById,
  getReportStatusTone,
  getReportTargetLabel,
  resolveReport,
  reviewReport,
  type ReportDetail,
} from '@/components/report/report-api';
import { UserAvatar } from '@/components/user/user-avatar';
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ReportDetailScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const { isLoading: isAuthLoading, session, user } = useAuth();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [supportRequestRejectionReason, setSupportRequestRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  const loadReport = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!isAdmin || !id) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getReportById(session.accessToken, id);
      setReport(data);
      setResolutionNote(data.resolutionNote ?? '');
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [id, isAdmin, isAuthLoading, session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [loadReport])
  );

  function openTarget() {
    if (!report) {
      return;
    }

    if (report.targetType === 'POST') {
      router.push({ pathname: '/post-detail', params: { id: report.targetId } });
      return;
    }

    if (report.targetType === 'SUPPORT_REQUEST') {
      router.push({ pathname: '/support-request-detail', params: { id: report.targetId } });
      return;
    }

    router.push({ pathname: '/user-detail', params: { id: report.targetId } });
  }

  async function handleReview() {
    const note = reviewNote.trim();

    if (!session?.accessToken || !id || !note) {
      setError('Review note is required.');
      return;
    }

    setIsActioning(true);
    setError('');

    try {
      const updated = await reviewReport(session.accessToken, id, {
        resolutionNote: note,
      });
      setReport(updated);
      setResolutionNote(updated.resolutionNote ?? note);
      setReviewNote('');
    } catch (reviewError) {
      setError(getAuthErrorMessage(reviewError));
    } finally {
      setIsActioning(false);
    }
  }

  async function handleResolve() {
    const note = resolutionNote.trim();
    const rejectionReason = supportRequestRejectionReason.trim();

    if (!session?.accessToken || !id || !report) {
      return;
    }

    if (!note) {
      setError('Resolution note is required.');
      return;
    }

    if (report.targetType === 'SUPPORT_REQUEST' && !rejectionReason) {
      setError('Support request rejection reason is required.');
      return;
    }

    setIsActioning(true);
    setError('');

    try {
      setReport(
        await resolveReport(session.accessToken, id, {
          resolutionNote: note,
          supportRequestRejectionReason:
            report.targetType === 'SUPPORT_REQUEST' ? rejectionReason : undefined,
        })
      );
    } catch (resolveError) {
      setError(getAuthErrorMessage(resolveError));
    } finally {
      setIsActioning(false);
    }
  }

  if (!isAdmin && !isAuthLoading) {
    return (
      <ManagementScreen title="Report Detail" onBackPress={() => router.back()}>
        <ManagementCard>
          <Text style={styles.restrictedTitle}>Admin only</Text>
          <Text style={styles.helperText}>Only admins can review report details.</Text>
        </ManagementCard>
      </ManagementScreen>
    );
  }

  return (
    <ManagementScreen
      title="Report Detail"
      onBackPress={() =>
        router.push({ pathname: '/(tabs)/system', params: { section: 'report' } })
      }
      rightSlot={
        report ? (
          <ManagementBadge
            label={report.status}
            tone={getReportStatusTone(report.status)}
          />
        ) : undefined
      }>
      {isLoading ? <Text style={styles.helperText}>Loading report...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {report ? (
        <>
          <ManagementSection title="Reporter">
            <ManagementCard>
              <View style={styles.reporterRow}>
                <UserAvatar
                  name={report.reporterName}
                  size={46}
                  uri={report.reporterAvatarUrl}
                />
                <View style={styles.reporterCopy}>
                  <Text style={styles.reporterName}>{report.reporterName}</Text>
                  <Text style={styles.helperText}>
                    Submitted {formatReportDateTime(report.createdAt)}
                  </Text>
                </View>
              </View>
            </ManagementCard>
          </ManagementSection>

          <ManagementSection title="Reported Target">
            <ManagementCard>
              <View style={styles.metaStack}>
                <ManagementMetaRow
                  icon="flag"
                  label="Type"
                  value={getReportTargetLabel(report.targetType)}
                />
                <ManagementMetaRow icon="hash" label="Target ID" value={report.targetId} />
              </View>
              <View style={styles.openTargetButton}>
                <ManagementButton
                  label="Open Target"
                  leftIcon={<Feather name="external-link" size={16} color={authPalette.primaryDark} />}
                  onPress={openTarget}
                  variant="outline"
                />
              </View>
            </ManagementCard>
          </ManagementSection>

          <ManagementSection title="Reason">
            <ManagementCard>
              <Text style={styles.reasonText}>{report.reason}</Text>
            </ManagementCard>
          </ManagementSection>

          {report.reviewedAt || report.resolutionNote ? (
            <ManagementSection title="Decision">
              <ManagementCard>
                <View style={styles.metaStack}>
                  <ManagementMetaRow
                    icon="clock"
                    label="Reviewed at"
                    value={formatReportDateTime(report.reviewedAt)}
                  />
                  <ManagementMetaRow
                    icon="file-text"
                    label="Note"
                    value={report.resolutionNote ?? 'Not available'}
                  />
                </View>
              </ManagementCard>
            </ManagementSection>
          ) : null}

          {report.status === 'PENDING' ? (
            <ManagementSection title="Review">
              <ManagementCard>
                <ManagementField
                  label="Review note"
                  maxLength={1000}
                  multiline
                  numberOfLines={4}
                  onChangeText={setReviewNote}
                  placeholder="Record what was checked before making a final decision."
                  value={reviewNote}
                />
                <View style={styles.formButton}>
                  <ManagementButton
                    disabled={isActioning}
                    label={isActioning ? 'Saving...' : 'Mark as Reviewed'}
                    onPress={handleReview}
                  />
                </View>
              </ManagementCard>
            </ManagementSection>
          ) : null}

          {report.status !== 'RESOLVED' ? (
            <ManagementSection title="Resolve">
              <ManagementCard>
                <Text style={styles.impactText}>
                  {report.targetType === 'POST'
                    ? 'Resolving removes this post.'
                    : report.targetType === 'SUPPORT_REQUEST'
                      ? 'Resolving rejects this support request.'
                      : 'Resolving records the decision. Account status must be changed separately.'}
                </Text>
                <View style={styles.formStack}>
                  <ManagementField
                    label="Resolution note"
                    maxLength={1000}
                    multiline
                    numberOfLines={4}
                    onChangeText={setResolutionNote}
                    placeholder="Explain the final decision."
                    value={resolutionNote}
                  />
                  {report.targetType === 'SUPPORT_REQUEST' ? (
                    <ManagementField
                      label="Support request rejection reason"
                      maxLength={200}
                      multiline
                      numberOfLines={3}
                      onChangeText={setSupportRequestRejectionReason}
                      placeholder="This reason will be stored on the support request."
                      value={supportRequestRejectionReason}
                    />
                  ) : null}
                </View>
                <View style={styles.formButton}>
                  <ManagementButton
                    disabled={isActioning}
                    label={isActioning ? 'Resolving...' : 'Resolve Report'}
                    leftIcon={<Feather name="check-circle" size={16} color="#FFFFFF" />}
                    onPress={handleResolve}
                    variant="danger"
                  />
                </View>
              </ManagementCard>
            </ManagementSection>
          ) : null}
        </>
      ) : null}
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  reporterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  reporterCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  reporterName: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 17,
  },
  metaStack: {
    gap: 14,
  },
  openTargetButton: {
    marginTop: 18,
  },
  reasonText: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 15,
    lineHeight: 23,
  },
  formStack: {
    gap: 16,
    marginTop: 16,
  },
  formButton: {
    marginTop: 16,
  },
  impactText: {
    backgroundColor: '#FFF1D8',
    borderRadius: 8,
    color: '#8A5B00',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 19,
    padding: 11,
  },
  helperText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 19,
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
  restrictedTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 19,
    marginBottom: 8,
  },
});
