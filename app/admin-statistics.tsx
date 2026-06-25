import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BarChart,
  PieChart,
  type barDataItem,
  type pieDataItem,
} from 'react-native-gifted-charts';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import {
  getAdminDashboardStatistics,
  type AdminDashboardStatistics,
} from '@/components/dashboard/dashboard-api';
import { SectionTabs } from '@/components/dashboard/section-tabs';
import { StatCard } from '@/components/dashboard/tab-ui';
import {
  ManagementButton,
  ManagementCard,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

type AdminStatsTab = 'users' | 'requests' | 'categories';
type PieSegment = pieDataItem & { label: string };

const chartColors = [
  '#2E7D55',
  '#94E6B7',
  '#F3B64D',
  '#EC756B',
  '#5D8EDB',
  '#7E6AD8',
  '#4FB5B3',
  '#8B9A8F',
];

const userGrowthData: barDataItem[] = [
  { frontColor: '#94E6B7', label: 'Jan', value: 18 },
  { frontColor: '#2E7D55', label: 'Feb', value: 26 },
  { frontColor: '#F3B64D', label: 'Mar', value: 21 },
  { frontColor: '#5D8EDB', label: 'Apr', value: 34 },
  { frontColor: '#4FB5B3', label: 'May', value: 42 },
  { frontColor: '#EC756B', label: 'Jun', value: 37 },
];

function buildPieSegments(
  items: { label: string; value: number; color?: string }[]
): PieSegment[] {
  return items
    .filter((item) => Number(item.value) > 0)
    .map((item, index) => ({
      color: item.color ?? chartColors[index % chartColors.length],
      label: item.label,
      value: Number(item.value),
    }));
}

function getTotal(segments: PieSegment[]) {
  return segments.reduce((sum, item) => sum + item.value, 0);
}

function getInactive(total: number, active: number) {
  return Math.max(Number(total || 0) - Number(active || 0), 0);
}

export default function AdminStatisticsScreen() {
  const { session, user } = useAuth();
  const [statistics, setStatistics] = useState<AdminDashboardStatistics | null>(null);
  const [activeTab, setActiveTab] = useState<AdminStatsTab>('users');
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

  const userStatusSegments = useMemo(
    () =>
      statistics
        ? buildPieSegments([
            { color: '#2E7D55', label: 'Active', value: statistics.users.activeUsers },
            { color: '#8B9A8F', label: 'Inactive', value: statistics.users.inactiveUsers },
          ])
        : [],
    [statistics]
  );

  const requestStatusSegments = useMemo(
    () =>
      statistics
        ? buildPieSegments([
            { color: '#F3B64D', label: 'Pending', value: statistics.supportRequests.pending },
            { color: '#2E7D55', label: 'Approved', value: statistics.supportRequests.approved },
            { color: '#4FB5B3', label: 'In Progress', value: statistics.supportRequests.inProgress },
            { color: '#8B9A8F', label: 'Completed', value: statistics.supportRequests.completed },
            { color: '#EC756B', label: 'Rejected', value: statistics.supportRequests.rejected },
            { color: '#7E6AD8', label: 'Cancelled', value: statistics.supportRequests.cancelled },
          ])
        : [],
    [statistics]
  );

  const categoryStatusSegments = useMemo(
    () =>
      statistics
        ? buildPieSegments([
            { color: '#2E7D55', label: 'Active', value: statistics.categories.activeCategories },
            {
              color: '#8B9A8F',
              label: 'Inactive',
              value: getInactive(
                statistics.categories.totalCategories,
                statistics.categories.activeCategories
              ),
            },
          ])
        : [],
    [statistics]
  );

  const categoryRequestSegments = useMemo(
    () =>
      statistics
        ? buildPieSegments(
            statistics.categories.categories.map((category, index) => ({
              color: chartColors[index % chartColors.length],
              label: category.categoryName,
              value: category.supportRequestCount,
            }))
          )
        : [],
    [statistics]
  );

  return (
    <ManagementScreen title="Admin Statistics" onBackPress={() => router.back()}>
      {user?.role !== 'ADMIN' ? (
        <ManagementCard>
          <Text style={styles.errorText}>This dashboard is available to admins only.</Text>
        </ManagementCard>
      ) : error ? (
        <ManagementCard>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.topGap}>
            <ManagementButton label="Try again" onPress={loadStatistics} variant="outline" />
          </View>
        </ManagementCard>
      ) : isLoading && !statistics ? (
        <ManagementCard>
          <Text style={styles.helperText}>Loading platform statistics...</Text>
        </ManagementCard>
      ) : statistics ? (
        <>
          <SectionTabs
            items={[
              {
                active: activeTab === 'users',
                icon: 'users',
                label: 'Users',
                onPress: () => setActiveTab('users'),
              },
              {
                active: activeTab === 'requests',
                icon: 'clipboard',
                label: 'Requests',
                onPress: () => setActiveTab('requests'),
              },
              {
                active: activeTab === 'categories',
                icon: 'grid',
                label: 'Categories',
                onPress: () => setActiveTab('categories'),
              },
            ]}
          />

          {activeTab === 'users' ? (
            <UsersStatistics
              segments={userStatusSegments}
              statistics={statistics}
            />
          ) : null}

          {activeTab === 'requests' ? (
            <SupportRequestStatistics
              segments={requestStatusSegments}
              statistics={statistics}
            />
          ) : null}

          {activeTab === 'categories' ? (
            <CategoryStatistics
              categoryRequestSegments={categoryRequestSegments}
              categoryStatusSegments={categoryStatusSegments}
              statistics={statistics}
            />
          ) : null}
        </>
      ) : null}
    </ManagementScreen>
  );
}

function UsersStatistics({
  segments,
  statistics,
}: {
  segments: PieSegment[];
  statistics: AdminDashboardStatistics;
}) {
  return (
    <>
      <ManagementSection title="Users">
        <View style={styles.statsRow}>
          <StatCard label="Total" value={String(statistics.users.totalUsers)} />
          <StatCard label="Active" tone="mint" value={String(statistics.users.activeUsers)} />
          <StatCard label="Inactive" tone="slate" value={String(statistics.users.inactiveUsers)} />
        </View>
      </ManagementSection>

      <PieChartCard
        centerLabel="Users"
        segments={segments}
        title="User status"
      />

      <ManagementSection title="User growth">
        <ManagementCard>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>New users over time</Text>
            <Text style={styles.demoPill}>Demo data</Text>
          </View>
          <View style={styles.barChartShell}>
            <BarChart
              barBorderRadius={8}
              barWidth={24}
              data={userGrowthData}
              endSpacing={8}
              frontColor={authPalette.primaryDark}
              height={170}
              hideRules
              initialSpacing={8}
              isAnimated
              maxValue={50}
              noOfSections={4}
              roundedTop
              spacing={14}
              width={230}
              xAxisColor="#DDE7DF"
              xAxisLabelTextStyle={styles.axisLabel}
              yAxisColor="#DDE7DF"
              yAxisLabelWidth={28}
              yAxisTextStyle={styles.axisLabel}
            />
          </View>
        </ManagementCard>
      </ManagementSection>
    </>
  );
}

function SupportRequestStatistics({
  segments,
  statistics,
}: {
  segments: PieSegment[];
  statistics: AdminDashboardStatistics;
}) {
  return (
    <>
      <ManagementSection title="Support Requests">
        <View style={styles.statsRow}>
          <StatCard
            label="Total"
            value={String(statistics.supportRequests.totalSupportRequests)}
          />
          <StatCard label="Pending" tone="amber" value={String(statistics.supportRequests.pending)} />
          <StatCard
            label="In progress"
            tone="mint"
            value={String(statistics.supportRequests.inProgress)}
          />
        </View>
      </ManagementSection>

      <PieChartCard
        centerLabel="Requests"
        segments={segments}
        title="Request status"
      />

      <ManagementSection title="Status counts">
        <ManagementCard>
          <MetricRow label="Approved" value={statistics.supportRequests.approved} />
          <MetricRow label="Completed" value={statistics.supportRequests.completed} />
          <MetricRow label="Rejected" value={statistics.supportRequests.rejected} />
          <MetricRow label="Cancelled" last value={statistics.supportRequests.cancelled} />
        </ManagementCard>
      </ManagementSection>
    </>
  );
}

function CategoryStatistics({
  categoryRequestSegments,
  categoryStatusSegments,
  statistics,
}: {
  categoryRequestSegments: PieSegment[];
  categoryStatusSegments: PieSegment[];
  statistics: AdminDashboardStatistics;
}) {
  const inactiveCategories = getInactive(
    statistics.categories.totalCategories,
    statistics.categories.activeCategories
  );

  return (
    <>
      <ManagementSection title="Categories">
        <View style={styles.statsRow}>
          <StatCard label="Total" value={String(statistics.categories.totalCategories)} />
          <StatCard
            label="Active"
            tone="mint"
            value={String(statistics.categories.activeCategories)}
          />
          <StatCard label="Inactive" tone="slate" value={String(inactiveCategories)} />
        </View>
      </ManagementSection>

      <PieChartCard
        centerLabel="Categories"
        segments={categoryStatusSegments}
        title="Category status"
      />

      <PieChartCard
        centerLabel="Requests"
        emptyText="No support requests are assigned to categories yet."
        segments={categoryRequestSegments}
        title="Requests by category"
      />
    </>
  );
}

function PieChartCard({
  centerLabel,
  emptyText = 'No chart data available yet.',
  segments,
  title,
}: {
  centerLabel: string;
  emptyText?: string;
  segments: PieSegment[];
  title: string;
}) {
  const total = getTotal(segments);

  return (
    <ManagementSection title={title}>
      <ManagementCard>
        {total > 0 ? (
          <View style={styles.pieContent}>
            <View style={styles.pieStage}>
              <PieChart
                centerLabelComponent={() => (
                  <View style={styles.pieCenter}>
                    <Text style={styles.pieCenterValue}>{total}</Text>
                    <Text style={styles.pieCenterLabel}>{centerLabel}</Text>
                  </View>
                )}
                data={segments}
                donut
                innerCircleColor="#FFFFFF"
                innerRadius={56}
                isAnimated
                radius={88}
                strokeColor="#FFFFFF"
                strokeWidth={3}
              />
            </View>
            <View style={styles.legendStack}>
              {segments.map((item) => (
                <LegendRow key={item.label} item={item} total={total} />
              ))}
            </View>
          </View>
        ) : (
          <Text style={styles.helperText}>{emptyText}</Text>
        )}
      </ManagementCard>
    </ManagementSection>
  );
}

function LegendRow({ item, total }: { item: PieSegment; total: number }) {
  const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
      <Text numberOfLines={1} style={styles.legendLabel}>
        {item.label}
      </Text>
      <Text style={styles.legendValue}>
        {item.value} ({percentage}%)
      </Text>
    </View>
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
  axisLabel: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 10,
  },
  barChartShell: {
    alignItems: 'center',
    marginTop: 16,
    overflow: 'hidden',
    paddingRight: 4,
  },
  cardTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
  chartHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  demoPill: {
    backgroundColor: '#FFF1D8',
    borderRadius: 999,
    color: '#9A6500',
    fontFamily: Fonts.rounded,
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  errorText: {
    color: '#AE3F3A',
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 21,
  },
  helperText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 21,
  },
  legendDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  legendLabel: {
    color: authPalette.text,
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
  legendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  legendStack: {
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  legendValue: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  metricLabel: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 14,
  },
  metricRow: {
    alignItems: 'center',
    borderBottomColor: '#E8EEE9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  metricRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  metricValue: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
  pieCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterLabel: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 10,
    marginTop: 2,
  },
  pieCenterValue: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 21,
  },
  pieContent: {
    alignItems: 'center',
    flexDirection: 'column',
    gap: 18,
  },
  pieStage: {
    alignItems: 'center',
    height: 184,
    justifyContent: 'center',
    width: 184,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  topGap: {
    marginTop: 14,
  },
});
