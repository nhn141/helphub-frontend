import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import {
  Badge,
  FilterChip,
  SectionHeader,
  SurfaceCard,
} from '@/components/dashboard/tab-ui';
import type { PageResponse } from '@/components/management/user-api';
import {
  approveRoleUpgradeRequest,
  formatRoleUpgradeDateTime,
  getRoleUpgradeRequests,
  getRoleUpgradeStatusTone,
  rejectRoleUpgradeRequest,
  type RoleUpgradeRequest,
  type RoleUpgradeRequestStatus,
} from '@/components/role-upgrade/role-upgrade-api';
import { useToast } from '@/components/ui/toast';
import { Fonts } from '@/constants/theme';

type RoleUpgradeFilter = RoleUpgradeRequestStatus | 'ALL';

const filters: { label: string; value: RoleUpgradeFilter }[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'All', value: 'ALL' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export function RoleUpgradeAdminContent() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<RoleUpgradeRequest[]>([]);
  const [pageData, setPageData] = useState<PageResponse<RoleUpgradeRequest> | null>(null);
  const [filter, setFilter] = useState<RoleUpgradeFilter>('PENDING');
  const [page, setPage] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [rejectionReasonById, setRejectionReasonById] = useState<Record<string, string>>({});
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [error, setError] = useState('');

  const approvedRequests = useMemo(
    () => requests.filter((request) => request.status === 'APPROVED').length,
    [requests]
  );

  const loadStats = useCallback(async () => {
    if (!session?.accessToken) {
      return;
    }

    setIsStatsLoading(true);

    try {
      const [allResult, pendingResult] = await Promise.all([
        getRoleUpgradeRequests(session.accessToken, { page: 0, size: 1 }),
        getRoleUpgradeRequests(session.accessToken, { page: 0, size: 1, status: 'PENDING' }),
      ]);

      setTotalRequests(allResult.totalElements);
      setPendingRequests(pendingResult.totalElements);
    } catch {
      // The list view is the main error surface; stats retry whenever the queue reloads.
    } finally {
      setIsStatsLoading(false);
    }
  }, [session?.accessToken]);

  const loadRequests = useCallback(async () => {
    if (!session?.accessToken) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getRoleUpgradeRequests(session.accessToken, {
        page,
        size: 10,
        status: filter === 'ALL' ? undefined : filter,
      });

      setRequests(data.content);
      setPageData(data);
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [filter, page, session?.accessToken]);

  useEffect(() => {
    loadRequests();
    loadStats();
  }, [loadRequests, loadStats]);

  function handleFilter(nextFilter: RoleUpgradeFilter) {
    setFilter(nextFilter);
    setPage(0);
  }

  async function handleApprove(request: RoleUpgradeRequest) {
    if (!session?.accessToken || actioningId) {
      return;
    }

    setActioningId(request.id);
    setError('');

    try {
      await approveRoleUpgradeRequest(session.accessToken, request.id);
      showToast({ message: 'Role upgrade approved.', type: 'success' });
      await Promise.all([loadRequests(), loadStats()]);
    } catch (approveError) {
      const message = getAuthErrorMessage(approveError);
      setError(message);
      showToast({ message, type: 'error' });
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(request: RoleUpgradeRequest) {
    if (!session?.accessToken || actioningId) {
      return;
    }

    const rejectionReason = rejectionReasonById[request.id]?.trim();

    if (!rejectionReason) {
      const message = 'Rejection reason is required.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    setActioningId(request.id);
    setError('');

    try {
      await rejectRoleUpgradeRequest(session.accessToken, request.id, { rejectionReason });
      setRejectionReasonById((current) => {
        const next = { ...current };
        delete next[request.id];
        return next;
      });
      showToast({ message: 'Role upgrade rejected.', type: 'success' });
      await Promise.all([loadRequests(), loadStats()]);
    } catch (rejectError) {
      const message = getAuthErrorMessage(rejectError);
      setError(message);
      showToast({ message, type: 'error' });
    } finally {
      setActioningId(null);
    }
  }

  return (
    <View style={styles.content}>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {isStatsLoading ? '--' : totalRequests.toString().padStart(2, '0')}
          </Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {isStatsLoading ? '--' : pendingRequests.toString().padStart(2, '0')}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{approvedRequests.toString().padStart(2, '0')}</Text>
          <Text style={styles.statLabel}>On page approved</Text>
        </View>
      </View>

      <View>
        <SectionHeader
          title="Role Upgrade"
          action={
            <Pressable accessibilityRole="button" onPress={loadRequests} style={styles.iconButton}>
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
                onPress={() => handleFilter(item.value)}
              />
            ))}
          </View>
        </SurfaceCard>
      </View>

      {isLoading ? <Text style={styles.helperText}>Loading role upgrade requests...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.stack}>
        {requests.map((request) => {
          const isPending = request.status === 'PENDING';
          const isActioning = actioningId === request.id;

          return (
            <SurfaceCard key={request.id}>
              <View style={styles.cardTop}>
                <Badge
                  label={request.status}
                  tone={getRoleUpgradeStatusTone(request.status)}
                />
                <Text style={styles.dateText}>
                  {formatRoleUpgradeDateTime(request.createdAt)}
                </Text>
              </View>

              <Text style={styles.requesterName}>{request.requesterName}</Text>
              <View style={styles.metaRow}>
                <Feather name="mail" size={14} color={authPalette.muted} />
                <Text style={styles.metaText}>{request.requesterEmail}</Text>
              </View>
              <View style={styles.metaRow}>
                <Feather name="shield" size={14} color={authPalette.muted} />
                <Text style={styles.metaText}>
                  {request.fromRole} to {request.toRole}
                </Text>
              </View>

              <Text style={styles.reasonText}>{request.reason}</Text>

              {request.reviewedAt ? (
                <View style={styles.decisionBox}>
                  <Text style={styles.decisionText}>
                    Reviewed by {request.reviewedByName ?? 'Admin'} on{' '}
                    {formatRoleUpgradeDateTime(request.reviewedAt)}
                  </Text>
                  {request.rejectionReason ? (
                    <Text style={styles.rejectionText}>{request.rejectionReason}</Text>
                  ) : null}
                </View>
              ) : null}

              {isPending ? (
                <>
                  <TextInput
                    maxLength={255}
                    multiline
                    onChangeText={(value) =>
                      setRejectionReasonById((current) => ({
                        ...current,
                        [request.id]: value,
                      }))
                    }
                    placeholder="Rejection reason"
                    placeholderTextColor="#93A095"
                    style={styles.reasonInput}
                    value={rejectionReasonById[request.id] ?? ''}
                  />
                  <View style={styles.actionRow}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isActioning}
                      onPress={() => handleReject(request)}
                      style={[styles.dangerButton, isActioning && styles.buttonDisabled]}>
                      <Feather name="x" size={15} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>Reject</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isActioning}
                      onPress={() => handleApprove(request)}
                      style={[styles.primaryButton, isActioning && styles.buttonDisabled]}>
                      <Feather name="check" size={15} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>Approve</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/user-detail',
                      params: { id: request.requesterId },
                    })
                  }
                  style={styles.profileButton}>
                  <Feather name="user" size={15} color={authPalette.primaryDark} />
                  <Text style={styles.profileButtonText}>Open profile</Text>
                </Pressable>
              )}
            </SurfaceCard>
          );
        })}

        {!isLoading && !error && requests.length === 0 ? (
          <SurfaceCard>
            <View style={styles.emptyState}>
              <Feather name="inbox" size={28} color="#AEBAB0" />
              <Text style={styles.helperText}>No role upgrade requests in this filter.</Text>
            </View>
          </SurfaceCard>
        ) : null}
      </View>

      {pageData && pageData.totalPages > 0 ? (
        <View style={styles.paginationRow}>
          <Pressable
            accessibilityRole="button"
            disabled={isLoading || pageData.first}
            onPress={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
            style={[styles.pageButton, (isLoading || pageData.first) && styles.buttonDisabled]}>
            <Text style={styles.pageButtonText}>Previous</Text>
          </Pressable>
          <View style={styles.pageBadge}>
            <Text style={styles.pageText}>
              {pageData.number + 1} / {pageData.totalPages}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isLoading || pageData.last}
            onPress={() => setPage((currentPage) => currentPage + 1)}
            style={[styles.pageButton, (isLoading || pageData.last) && styles.buttonDisabled]}>
            <Text style={styles.pageButtonText}>Next</Text>
          </Pressable>
        </View>
      ) : null}
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
    minWidth: 112,
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
  requesterName: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
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
  reasonInput: {
    backgroundColor: authPalette.field,
    borderRadius: 8,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    marginTop: 14,
    minHeight: 76,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: authPalette.primaryDark,
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: '#B94540',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 14,
  },
  profileButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 7,
    marginTop: 15,
  },
  profileButtonText: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
  decisionBox: {
    backgroundColor: '#EEF7F0',
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
    padding: 11,
  },
  decisionText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
  },
  rejectionText: {
    color: '#AE3F3A',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
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
  paginationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  pageButton: {
    alignItems: 'center',
    borderColor: '#BDE7CF',
    borderRadius: 8,
    borderWidth: 1.4,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 92,
    paddingHorizontal: 12,
  },
  pageButtonText: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
  pageBadge: {
    alignItems: 'center',
    backgroundColor: '#EEF7F0',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 72,
    paddingHorizontal: 12,
  },
  pageText: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.48,
  },
});
