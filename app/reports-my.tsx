import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementScreen,
} from '@/components/management/management-ui';
import {
  formatReportDateTime,
  getMyReports,
  getReportStatusTone,
  getReportTargetLabel,
  type ReportSummary,
} from '@/components/report/report-api';
import { Fonts } from '@/constants/theme';

export default function MyReportsScreen() {
  const { session } = useAuth();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReports = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      setReports(await getMyReports(session.accessToken));
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  function openTarget(report: ReportSummary) {
    if (report.targetType === 'POST') {
      router.push({ pathname: '/post-detail', params: { id: report.targetId } });
      return;
    }

    if (report.targetType === 'SUPPORT_REQUEST') {
      router.push({ pathname: '/support-request-detail', params: { id: report.targetId } });
    }
  }

  return (
    <ManagementScreen
      title="My Reports"
      onBackPress={() => router.push('/(tabs)/profile')}
      rightSlot={<ManagementBadge label={`${reports.length}`} tone="slate" />}>
      {isLoading ? <Text style={styles.helperText}>Loading reports...</Text> : null}

      {error ? (
        <ManagementCard>
          <Text style={styles.errorTitle}>Could not load reports</Text>
          <Text style={styles.helperText}>{error}</Text>
          <View style={styles.retryButton}>
            <ManagementButton label="Try Again" onPress={loadReports} variant="outline" />
          </View>
        </ManagementCard>
      ) : null}

      {!isLoading && !error && reports.length === 0 ? (
        <ManagementCard>
          <View style={styles.emptyState}>
            <Feather name="flag" size={30} color="#AEBAB0" />
            <Text style={styles.emptyTitle}>No reports submitted</Text>
          </View>
        </ManagementCard>
      ) : null}

      <View style={styles.stack}>
        {reports.map((report) => {
          const canOpenTarget = report.targetType !== 'USER';

          return (
            <ManagementCard key={report.id}>
              <View style={styles.cardTop}>
                <ManagementBadge
                  label={report.status}
                  tone={getReportStatusTone(report.status)}
                />
                <Text style={styles.dateText}>{formatReportDateTime(report.createdAt)}</Text>
              </View>
              <Text style={styles.targetTitle}>{getReportTargetLabel(report.targetType)}</Text>
              <Text numberOfLines={1} style={styles.targetId}>
                {report.targetId}
              </Text>

              {canOpenTarget ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openTarget(report)}
                  style={styles.targetButton}>
                  <Text style={styles.targetButtonText}>Open target</Text>
                  <Feather name="arrow-right" size={15} color={authPalette.primaryDark} />
                </Pressable>
              ) : null}
            </ManagementCard>
          );
        })}
      </View>
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
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
  targetTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 17,
    marginTop: 14,
  },
  targetId: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
    marginTop: 5,
  },
  targetButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 7,
    marginTop: 14,
  },
  targetButtonText: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
  helperText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 21,
  },
  errorTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 16,
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 16,
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
