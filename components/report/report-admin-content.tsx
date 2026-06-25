import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import {
  Badge,
  FilterChip,
  SectionHeader,
  SurfaceCard,
} from '@/components/dashboard/tab-ui';
import {
  formatReportDateTime,
  getAllReports,
  getReportStatusTone,
  getReportTargetLabel,
  type ReportStatus,
  type ReportSummary,
} from '@/components/report/report-api';
import { Fonts } from '@/constants/theme';

type ReportFilter = ReportStatus | 'ALL';

const filters: { label: string; value: ReportFilter }[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'All', value: 'ALL' },
  { label: 'Reviewed', value: 'REVIEWED' },
  { label: 'Resolved', value: 'RESOLVED' },
];

export function ReportAdminContent() {
  const { session } = useAuth();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [filter, setFilter] = useState<ReportFilter>('PENDING');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredReports = useMemo(
    () => (filter === 'ALL' ? reports : reports.filter((report) => report.status === filter)),
    [filter, reports]
  );

  const pendingCount = useMemo(
    () => reports.filter((report) => report.status === 'PENDING').length,
    [reports]
  );

  const loadReports = useCallback(async () => {
    if (!session?.accessToken) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      setReports(await getAllReports(session.accessToken));
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <View style={styles.content}>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{reports.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {reports.filter((report) => report.status === 'RESOLVED').length}
          </Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      <View>
        <SectionHeader
          title="Reports"
          action={
            <Pressable accessibilityRole="button" onPress={loadReports} style={styles.iconButton}>
              <Feather name="refresh-cw" size={16} color={authPalette.primaryDark} />
            </Pressable>
          }
        />
        <SurfaceCard>
          <View style={styles.filters}>
            {filters.map((item) => (
              <FilterChip
                active={filter === item.value}
                key={item.value}
                label={item.label}
                onPress={() => setFilter(item.value)}
              />
            ))}
          </View>
        </SurfaceCard>
      </View>

      {isLoading ? <Text style={styles.helperText}>Loading reports...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.stack}>
        {filteredReports.map((report) => (
          <SurfaceCard key={report.id}>
            <View style={styles.cardTop}>
              <Badge label={report.status} tone={getReportStatusTone(report.status)} />
              <Text style={styles.dateText}>{formatReportDateTime(report.createdAt)}</Text>
            </View>
            <Text style={styles.targetTitle}>{getReportTargetLabel(report.targetType)}</Text>
            <View style={styles.metaRow}>
              <Feather name="user" size={14} color={authPalette.muted} />
              <Text style={styles.metaText}>{report.reporterName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Feather name="hash" size={14} color={authPalette.muted} />
              <Text numberOfLines={1} style={styles.metaText}>
                {report.targetId}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/report-detail' as never,
                  params: { id: report.id },
                })
              }
              style={styles.reviewButton}>
              <Feather name="eye" size={15} color="#FFFFFF" />
              <Text style={styles.reviewButtonText}>
                {report.status === 'PENDING' ? 'Review' : 'View decision'}
              </Text>
            </Pressable>
          </SurfaceCard>
        ))}

        {!isLoading && !error && filteredReports.length === 0 ? (
          <SurfaceCard>
            <View style={styles.emptyState}>
              <Feather name="flag" size={28} color="#AEBAB0" />
              <Text style={styles.helperText}>No reports in this filter.</Text>
            </View>
          </SurfaceCard>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stat: {
    backgroundColor: '#E5F6ED',
    borderRadius: 8,
    minWidth: 100,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  statValue: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 21,
  },
  statLabel: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
    marginTop: 4,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#ECF5EF',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
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
  targetTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 17,
    marginTop: 13,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 9,
  },
  metaText: {
    color: authPalette.muted,
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
  },
  reviewButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: authPalette.primaryDark,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 7,
    marginTop: 15,
    minHeight: 40,
    paddingHorizontal: 14,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
  helperText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#AE3F3A',
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    gap: 9,
    paddingVertical: 24,
  },
});
