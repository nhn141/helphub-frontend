import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import {
  getAdminDashboardStatistics,
  type AdminDashboardStatistics,
} from '@/components/dashboard/dashboard-api';
import { StatCard } from '@/components/dashboard/tab-ui';
import {
  ManagementButton,
  ManagementCard,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

export default function AdminStatisticsScreen() {
  const { session, user } = useAuth();
  const [statistics, setStatistics] = useState<AdminDashboardStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStatistics = useCallback(async () => {
    if (!session?.accessToken || user?.role !== 'ADMIN') {
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      setStatistics(await getAdminDashboardStatistics(session.accessToken));
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, user?.role]);

  useFocusEffect(useCallback(() => void loadStatistics(), [loadStatistics]));

  return (
    <ManagementScreen title="Admin Statistics" onBackPress={() => router.back()}>
      {user?.role !== 'ADMIN' ? (
        <ManagementCard><Text style={styles.errorText}>This dashboard is available to admins only.</Text></ManagementCard>
      ) : error ? (
        <ManagementCard>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.topGap}><ManagementButton label="Try again" onPress={loadStatistics} variant="outline" /></View>
        </ManagementCard>
      ) : isLoading && !statistics ? (
        <ManagementCard><Text style={styles.helperText}>Loading platform statistics...</Text></ManagementCard>
      ) : statistics ? (
        <>
          <ManagementSection title="Users">
            <View style={styles.statsRow}>
              <StatCard label="Total" value={String(statistics.users.totalUsers)} />
              <StatCard label="Active" tone="mint" value={String(statistics.users.activeUsers)} />
              <StatCard label="Inactive" tone="slate" value={String(statistics.users.inactiveUsers)} />
            </View>
            <ManagementCard>
              <MetricRow label="Requesters" value={statistics.users.requesters} />
              <MetricRow label="Volunteers" value={statistics.users.volunteers} />
              <MetricRow label="Collaborators" value={statistics.users.collaborators} />
              <MetricRow label="Admins" value={statistics.users.admins} last />
            </ManagementCard>
          </ManagementSection>

          <ManagementSection title="Support requests">
            <View style={styles.statsRow}>
              <StatCard label="Total" value={String(statistics.supportRequests.totalSupportRequests)} />
              <StatCard label="Pending" tone="amber" value={String(statistics.supportRequests.pending)} />
              <StatCard label="In progress" tone="mint" value={String(statistics.supportRequests.inProgress)} />
            </View>
            <ManagementCard>
              <MetricRow label="Approved" value={statistics.supportRequests.approved} />
              <MetricRow label="Completed" value={statistics.supportRequests.completed} />
              <MetricRow label="Rejected" value={statistics.supportRequests.rejected} />
              <MetricRow label="Cancelled" value={statistics.supportRequests.cancelled} last />
            </ManagementCard>
          </ManagementSection>

          <ManagementSection title="Moderation">
            <View style={styles.statsRow}>
              <StatCard label="Reports" value={String(statistics.reports.totalReports)} />
              <StatCard label="Pending" tone="amber" value={String(statistics.reports.pending)} />
              <StatCard label="Resolved" tone="mint" value={String(statistics.reports.resolved)} />
            </View>
            <ManagementCard>
              <MetricRow label="Post reports" value={statistics.reports.postReports} />
              <MetricRow label="Request reports" value={statistics.reports.supportRequestReports} />
              <MetricRow label="User reports" value={statistics.reports.userReports} />
              <MetricRow label="Reviewed" value={statistics.reports.reviewed} last />
            </ManagementCard>
          </ManagementSection>

          <ManagementSection title="Posts and categories">
            <View style={styles.statsRow}>
              <StatCard label="Posts" value={String(statistics.posts.totalPosts)} />
              <StatCard label="Active posts" tone="mint" value={String(statistics.posts.active)} />
              <StatCard label="Categories" tone="slate" value={String(statistics.categories.totalCategories)} />
            </View>
            <ManagementCard>
              <MetricRow label="Posts under review" value={statistics.posts.underReview} />
              <MetricRow label="Hidden posts" value={statistics.posts.hidden} />
              <MetricRow label="Removed posts" value={statistics.posts.removed} />
              <MetricRow label="Active categories" value={statistics.categories.activeCategories} last />
            </ManagementCard>
            {statistics.categories.categories.length > 0 ? (
              <ManagementCard>
                <Text style={styles.cardTitle}>Requests by category</Text>
                <View style={styles.categoryStack}>
                  {statistics.categories.categories.map((category, index) => (
                    <MetricRow
                      key={category.categoryId}
                      label={category.categoryName}
                      last={index === statistics.categories.categories.length - 1}
                      value={category.supportRequestCount}
                    />
                  ))}
                </View>
              </ManagementCard>
            ) : null}
          </ManagementSection>
        </>
      ) : null}
    </ManagementScreen>
  );
}

function MetricRow({ label, last = false, value }: { label: string; last?: boolean; value: number }) {
  return (
    <View style={[styles.metricRow, last && styles.metricRowLast]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { color: authPalette.text, fontFamily: Fonts.rounded, fontSize: 16, marginBottom: 8 },
  categoryStack: { marginTop: 6 },
  errorText: { color: '#AE3F3A', fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 21 },
  helperText: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 14 },
  metricLabel: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 14 },
  metricRow: { alignItems: 'center', borderBottomColor: '#E8EEE9', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  metricRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  metricValue: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 16 },
  statsRow: { flexDirection: 'row', gap: 10 },
  topGap: { marginTop: 14 },
});
