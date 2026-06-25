import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CategoryManagementContent } from '@/app/(tabs)/categories';
import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import { Badge, DashboardScreen, FilterChip, SectionHeader, SurfaceCard } from '@/components/dashboard/tab-ui';
import { SectionTabs } from '@/components/dashboard/section-tabs';
import {
  formatUserDateTime,
  getUsers,
  type PageResponse,
  type UserRole,
  type UserSummary,
} from '@/components/management/user-api';
import {
  approveVolunteerAssignment,
  formatDateTime,
  getSupportRequests,
  getVolunteerAssignmentsBySupportRequest,
  rejectVolunteerAssignment,
  type VolunteerAssignment,
  type VolunteerAssignmentStatus,
} from '@/components/support-request/request-api';
import { UserAvatar } from '@/components/user/user-avatar';
import { ReportAdminContent } from '@/components/report/report-admin-content';
import { useToast } from '@/components/ui/toast';
import { getRoleTone } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

type SystemSection = 'manage-user' | 'report' | 'category';
type ManageUserView = 'users' | 'assignments';
type AssignmentFilter = VolunteerAssignmentStatus | 'ALL';

const userRoles: UserRole[] = ['REQUESTER', 'VOLUNTEER', 'COLLABORATOR', 'ADMIN'];

const roleOptions: { label: string; value: UserRole | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Requester', value: 'REQUESTER' },
  { label: 'Volunteer', value: 'VOLUNTEER' },
  { label: 'Collaborator', value: 'COLLABORATOR' },
  { label: 'Admin', value: 'ADMIN' },
];

const assignmentFilters: { label: string; value: AssignmentFilter }[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'All', value: 'ALL' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Completed', value: 'COMPLETED' },
];

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getSystemSection(value: string | undefined): SystemSection {
  if (value === 'report' || value === 'category') {
    return value;
  }

  return 'manage-user';
}

function getManageUserView(value: string | undefined): ManageUserView {
  return value === 'assignments' ? 'assignments' : 'users';
}

function getAssignmentTone(status: VolunteerAssignmentStatus): 'green' | 'mint' | 'amber' | 'slate' | 'red' {
  if (status === 'PENDING') {
    return 'amber';
  }

  if (status === 'ACCEPTED') {
    return 'green';
  }

  if (status === 'COMPLETED') {
    return 'slate';
  }

  return 'red';
}

function getAssignmentKey(assignment: VolunteerAssignment) {
  return `${assignment.supportRequestId}:${assignment.volunteerId}`;
}

export default function SystemTabScreen() {
  const params = useLocalSearchParams();
  const { isLoading: isAuthLoading, session, user } = useAuth();
  const { showToast } = useToast();
  const activeSection = getSystemSection(getStringParam(params.section));
  const activeManageView = getManageUserView(getStringParam(params.view));
  const isAdmin = user?.role === 'ADMIN';

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [pageData, setPageData] = useState<PageResponse<UserSummary> | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [roleStats, setRoleStats] = useState<Record<UserRole | 'ALL', number>>({
    ALL: 0,
    ADMIN: 0,
    COLLABORATOR: 0,
    REQUESTER: 0,
    VOLUNTEER: 0,
  });
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('PENDING');
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  const [rejectReasonByKey, setRejectReasonByKey] = useState<Record<string, string>>({});
  const [actioningAssignmentKey, setActioningAssignmentKey] = useState<string | null>(null);

  const filteredAssignments = useMemo(() => {
    if (assignmentFilter === 'ALL') {
      return assignments;
    }

    return assignments.filter((assignment) => assignment.status === assignmentFilter);
  }, [assignmentFilter, assignments]);

  const pendingAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === 'PENDING').length,
    [assignments]
  );

  const loadUserStats = useCallback(async () => {
    if (!session?.accessToken || !isAdmin) {
      return;
    }

    setIsStatsLoading(true);

    try {
      const [allResult, ...roleResults] = await Promise.all([
        getUsers(session.accessToken, { page: 0, size: 1 }),
        ...userRoles.map((role) => getUsers(session.accessToken, { page: 0, role, size: 1 })),
      ]);

      setRoleStats({
        ALL: allResult.totalElements,
        ADMIN: roleResults[userRoles.indexOf('ADMIN')].totalElements,
        COLLABORATOR: roleResults[userRoles.indexOf('COLLABORATOR')].totalElements,
        REQUESTER: roleResults[userRoles.indexOf('REQUESTER')].totalElements,
        VOLUNTEER: roleResults[userRoles.indexOf('VOLUNTEER')].totalElements,
      });
    } catch {
      // User list remains the main error surface; stats can quietly retry on focus.
    } finally {
      setIsStatsLoading(false);
    }
  }, [isAdmin, session?.accessToken]);

  const loadUsers = useCallback(async () => {
    if (isAuthLoading || !isAdmin) {
      return;
    }

    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    setIsUsersLoading(true);
    setUsersError('');

    try {
      const data = await getUsers(session.accessToken, {
        keyword,
        page,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        size: 10,
        sort: 'createdAt,desc',
      });

      setUsers(data.content);
      setPageData(data);
    } catch (loadError) {
      setUsersError(getAuthErrorMessage(loadError));
    } finally {
      setIsUsersLoading(false);
    }
  }, [isAdmin, isAuthLoading, keyword, page, roleFilter, session?.accessToken]);

  const loadAssignments = useCallback(async () => {
    if (isAuthLoading || !isAdmin) {
      return;
    }

    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    setIsAssignmentsLoading(true);
    setAssignmentError('');

    try {
      const requests = await getSupportRequests(session.accessToken);
      const assignmentResults = await Promise.allSettled(
        requests.map((request) =>
          getVolunteerAssignmentsBySupportRequest(session.accessToken, request.id)
        )
      );
      const nextAssignments = assignmentResults
        .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
        .sort((left, right) => {
          if (left.status === 'PENDING' && right.status !== 'PENDING') {
            return -1;
          }

          if (left.status !== 'PENDING' && right.status === 'PENDING') {
            return 1;
          }

          return Date.parse(right.assignedAt) - Date.parse(left.assignedAt);
        });

      setAssignments(nextAssignments);
    } catch (loadError) {
      setAssignmentError(getAuthErrorMessage(loadError));
    } finally {
      setIsAssignmentsLoading(false);
    }
  }, [isAdmin, isAuthLoading, session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      if (activeSection !== 'manage-user') {
        return;
      }

      if (activeManageView === 'users') {
        loadUsers();
        loadUserStats();
      } else {
        loadAssignments();
      }
    }, [activeManageView, activeSection, loadAssignments, loadUserStats, loadUsers])
  );

  function openSection(section: SystemSection) {
    router.push({
      pathname: '/(tabs)/system',
      params: {
        section,
        view: section === 'manage-user' ? activeManageView : undefined,
      },
    });
  }

  function openManageUserView(view: ManageUserView) {
    router.push({
      pathname: '/(tabs)/system',
      params: { section: 'manage-user', view },
    });
  }

  function handleSearch() {
    setPage(0);
    setKeyword(keywordInput.trim());
  }

  function handleClearUsers() {
    setKeywordInput('');
    setKeyword('');
    setRoleFilter('ALL');
    setPage(0);
  }

  function handleRoleFilter(nextRole: UserRole | 'ALL') {
    setRoleFilter(nextRole);
    setPage(0);
  }

  async function handleApproveAssignment(assignment: VolunteerAssignment) {
    if (!session?.accessToken) {
      return;
    }

    const key = getAssignmentKey(assignment);
    setActioningAssignmentKey(key);
    setAssignmentError('');

    try {
      const updated = await approveVolunteerAssignment(
        session.accessToken,
        assignment.supportRequestId,
        assignment.volunteerId
      );
      setAssignments((current) =>
        current.map((item) => (getAssignmentKey(item) === key ? updated : item))
      );
      showToast({ message: 'Volunteer assignment approved.', type: 'success' });
    } catch (approveError) {
      const message = getAuthErrorMessage(approveError);
      setAssignmentError(message);
      showToast({ message, type: 'error' });
    } finally {
      setActioningAssignmentKey(null);
    }
  }

  async function handleRejectAssignment(assignment: VolunteerAssignment) {
    if (!session?.accessToken) {
      return;
    }

    const key = getAssignmentKey(assignment);
    const reason = rejectReasonByKey[key]?.trim() || 'Rejected by admin.';
    setActioningAssignmentKey(key);
    setAssignmentError('');

    try {
      const updated = await rejectVolunteerAssignment(
        session.accessToken,
        assignment.supportRequestId,
        assignment.volunteerId,
        reason
      );
      setAssignments((current) =>
        current.map((item) => (getAssignmentKey(item) === key ? updated : item))
      );
      setRejectReasonByKey((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      showToast({ message: 'Volunteer assignment rejected.', type: 'success' });
    } catch (rejectError) {
      const message = getAuthErrorMessage(rejectError);
      setAssignmentError(message);
      showToast({ message, type: 'error' });
    } finally {
      setActioningAssignmentKey(null);
    }
  }

  if (!isAdmin && !isAuthLoading) {
    return (
      <DashboardScreen title="System">
        <SurfaceCard>
          <Text style={styles.restrictedTitle}>Admin only</Text>
          <Text style={styles.restrictedBody}>
            System management belongs to the admin workspace.
          </Text>
        </SurfaceCard>
      </DashboardScreen>
    );
  }

  return (
    <DashboardScreen title="System">
      <SectionTabs
        items={[
          {
            active: activeSection === 'manage-user',
            icon: 'users',
            label: 'Manage User',
            onPress: () => openSection('manage-user'),
          },
          {
            active: activeSection === 'report',
            icon: 'flag',
            label: 'Report',
            onPress: () => openSection('report'),
          },
          {
            active: activeSection === 'category',
            icon: 'grid',
            label: 'Category',
            onPress: () => openSection('category'),
          },
        ]}
      />

      {activeSection === 'manage-user' ? (
        <>
          <SectionTabs
            items={[
              {
                active: activeManageView === 'users',
                icon: 'user',
                label: 'User',
                onPress: () => openManageUserView('users'),
              },
              {
                active: activeManageView === 'assignments',
                icon: 'check-square',
                label: 'Volunteer Assignment',
                onPress: () => openManageUserView('assignments'),
              },
            ]}
          />

          {activeManageView === 'users' ? (
            <>
              <View style={styles.statGrid}>
                <MiniStat label="Total" loading={isStatsLoading} value={roleStats.ALL} />
                <MiniStat label="Requester" loading={isStatsLoading} value={roleStats.REQUESTER} />
                <MiniStat label="Volunteer" loading={isStatsLoading} value={roleStats.VOLUNTEER} />
                <MiniStat
                  label="Collaborator"
                  loading={isStatsLoading}
                  value={roleStats.COLLABORATOR}
                />
                <MiniStat label="Admin" loading={isStatsLoading} value={roleStats.ADMIN} />
              </View>

              <View>
                <SectionHeader
                  title="User Directory"
                  action={
                    <Pressable accessibilityRole="button" onPress={loadUsers} style={styles.iconAction}>
                      <Feather name="refresh-cw" size={16} color={authPalette.primaryDark} />
                    </Pressable>
                  }
                />
                <SurfaceCard>
                  <View style={styles.searchRow}>
                    <View style={styles.searchShell}>
                      <Feather name="search" size={16} color={authPalette.muted} />
                      <TextInput
                        onChangeText={setKeywordInput}
                        onSubmitEditing={handleSearch}
                        placeholder="Search by name"
                        placeholderTextColor="#93A095"
                        returnKeyType="search"
                        style={styles.searchInput}
                        value={keywordInput}
                      />
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={handleSearch}
                      style={styles.searchButton}>
                      <Feather name="arrow-right" size={18} color="#FFFFFF" />
                    </Pressable>
                  </View>

                  <View style={styles.filterWrap}>
                    {roleOptions.map((option) => (
                      <Pressable
                        accessibilityRole="button"
                        key={option.value}
                        onPress={() => handleRoleFilter(option.value)}>
                        <FilterChip active={roleFilter === option.value} label={option.label} />
                      </Pressable>
                    ))}
                  </View>

                  {keyword || roleFilter !== 'ALL' ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={handleClearUsers}
                      style={styles.clearButton}>
                      <Feather name="x" size={14} color={authPalette.primaryDark} />
                      <Text style={styles.clearButtonText}>Clear filters</Text>
                    </Pressable>
                  ) : null}
                </SurfaceCard>
              </View>

              {isUsersLoading ? <Text style={styles.helperText}>Loading users...</Text> : null}
              {usersError ? <Text style={styles.errorText}>{usersError}</Text> : null}

              <View style={styles.stack}>
                {users.map((item) => (
                  <SurfaceCard key={item.id}>
                    <View style={styles.userCardTop}>
                      <UserAvatar name={item.fullName} size={46} uri={item.avatarUrl} />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{item.fullName}</Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                      </View>
                    </View>

                    <View style={styles.badgeRow}>
                      <Badge label={item.role} tone={getRoleTone(item.role)} />
                      <Badge
                        label={item.isActive ? 'ACTIVE' : 'INACTIVE'}
                        tone={item.isActive ? 'green' : 'slate'}
                      />
                    </View>

                    <View style={styles.metaRow}>
                      <Feather name="phone" size={14} color={authPalette.muted} />
                      <Text style={styles.metaText}>{item.phone ?? 'No phone number'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Feather name="calendar" size={14} color={authPalette.muted} />
                      <Text style={styles.metaText}>Joined {formatUserDateTime(item.createdAt)}</Text>
                    </View>

                    <View style={styles.actionRow}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          router.push({ pathname: '/user-detail', params: { id: item.id } })
                        }
                        style={styles.outlineButton}>
                        <Feather name="eye" size={15} color={authPalette.primaryDark} />
                        <Text style={styles.outlineButtonText}>Detail</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          router.push({ pathname: '/user-role', params: { id: item.id } })
                        }
                        style={styles.primaryButton}>
                        <Feather name="shield" size={15} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Role</Text>
                      </Pressable>
                    </View>
                  </SurfaceCard>
                ))}

                {!isUsersLoading && users.length === 0 && !usersError ? (
                  <SurfaceCard>
                    <Text style={styles.emptyText}>No users found.</Text>
                  </SurfaceCard>
                ) : null}
              </View>

              {pageData && pageData.totalPages > 0 ? (
                <View style={styles.paginationRow}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isUsersLoading || pageData.first}
                    onPress={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
                    style={[styles.pageButton, (isUsersLoading || pageData.first) && styles.buttonDisabled]}>
                    <Text style={styles.pageButtonText}>Previous</Text>
                  </Pressable>
                  <View style={styles.pageBadge}>
                    <Text style={styles.pageText}>
                      {pageData.number + 1} / {pageData.totalPages}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isUsersLoading || pageData.last}
                    onPress={() => setPage((currentPage) => currentPage + 1)}
                    style={[styles.pageButton, (isUsersLoading || pageData.last) && styles.buttonDisabled]}>
                    <Text style={styles.pageButtonText}>Next</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.statGrid}>
                <MiniStat label="Total" value={assignments.length} />
                <MiniStat label="Pending" value={pendingAssignments} />
                <MiniStat
                  label="Accepted"
                  value={assignments.filter((item) => item.status === 'ACCEPTED').length}
                />
              </View>

              <View>
                <SectionHeader
                  title="Volunteer Assignment"
                  action={
                    <Pressable accessibilityRole="button" onPress={loadAssignments} style={styles.iconAction}>
                      <Feather name="refresh-cw" size={16} color={authPalette.primaryDark} />
                    </Pressable>
                  }
                />
                <SurfaceCard>
                  <View style={styles.filterWrap}>
                    {assignmentFilters.map((item) => (
                      <Pressable
                        accessibilityRole="button"
                        key={item.value}
                        onPress={() => setAssignmentFilter(item.value)}>
                        <FilterChip active={assignmentFilter === item.value} label={item.label} />
                      </Pressable>
                    ))}
                  </View>
                </SurfaceCard>
              </View>

              {isAssignmentsLoading ? (
                <Text style={styles.helperText}>Loading volunteer assignments...</Text>
              ) : null}
              {assignmentError ? <Text style={styles.errorText}>{assignmentError}</Text> : null}

              <View style={styles.stack}>
                {filteredAssignments.map((assignment) => {
                  const key = getAssignmentKey(assignment);
                  const isPending = assignment.status === 'PENDING';
                  const isActioning = actioningAssignmentKey === key;

                  return (
                    <SurfaceCard key={key}>
                      <View style={styles.cardTop}>
                        <Badge label={assignment.status} tone={getAssignmentTone(assignment.status)} />
                        <Text style={styles.cardMeta}>{formatDateTime(assignment.assignedAt)}</Text>
                      </View>
                      <Text style={styles.cardTitle}>{assignment.supportRequestTitle}</Text>
                      <View style={styles.metaRow}>
                        <Feather name="user" size={14} color={authPalette.muted} />
                        <Text style={styles.metaText}>{assignment.volunteerName}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Feather name="mail" size={14} color={authPalette.muted} />
                        <Text style={styles.metaText}>{assignment.volunteerEmail}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Feather name="phone" size={14} color={authPalette.muted} />
                        <Text style={styles.metaText}>
                          {assignment.volunteerPhone ?? 'No phone number'}
                        </Text>
                      </View>

                      {assignment.rejectionReason ? (
                        <Text style={styles.rejectionText}>{assignment.rejectionReason}</Text>
                      ) : null}

                      {isPending ? (
                        <>
                          <TextInput
                            multiline
                            onChangeText={(value) =>
                              setRejectReasonByKey((current) => ({ ...current, [key]: value }))
                            }
                            placeholder="Reject reason"
                            placeholderTextColor="#93A095"
                            style={styles.reasonInput}
                            value={rejectReasonByKey[key] ?? ''}
                          />
                          <View style={styles.actionRow}>
                            <Pressable
                              accessibilityRole="button"
                              disabled={isActioning}
                              onPress={() => handleRejectAssignment(assignment)}
                              style={[styles.dangerButton, isActioning && styles.buttonDisabled]}>
                              <Feather name="x" size={15} color="#FFFFFF" />
                              <Text style={styles.primaryButtonText}>Reject</Text>
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              disabled={isActioning}
                              onPress={() => handleApproveAssignment(assignment)}
                              style={[styles.primaryButton, isActioning && styles.buttonDisabled]}>
                              <Feather name="check" size={15} color="#FFFFFF" />
                              <Text style={styles.primaryButtonText}>Approve</Text>
                            </Pressable>
                          </View>
                        </>
                      ) : null}
                    </SurfaceCard>
                  );
                })}

                {!isAssignmentsLoading && filteredAssignments.length === 0 && !assignmentError ? (
                  <SurfaceCard>
                    <Text style={styles.emptyText}>No volunteer assignments in this filter.</Text>
                  </SurfaceCard>
                ) : null}
              </View>
            </>
          )}
        </>
      ) : null}

      {activeSection === 'report' ? (
        <ReportAdminContent />
      ) : null}

      {activeSection === 'category' ? <CategoryManagementContent /> : null}
    </DashboardScreen>
  );
}

function MiniStat({
  label,
  loading,
  value,
}: {
  label: string;
  loading?: boolean;
  value: number;
}) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{loading ? '--' : value.toString().padStart(2, '0')}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  miniStat: {
    backgroundColor: '#E5F6ED',
    borderRadius: 8,
    minWidth: 112,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  miniStatValue: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 22,
  },
  miniStatLabel: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  searchShell: {
    alignItems: 'center',
    backgroundColor: authPalette.field,
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 46,
    paddingHorizontal: 13,
  },
  searchInput: {
    color: authPalette.text,
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    minWidth: 0,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: authPalette.primaryDark,
    borderRadius: 8,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 14,
  },
  clearButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  clearButtonText: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
  iconAction: {
    alignItems: 'center',
    backgroundColor: '#ECF5EF',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stack: {
    gap: 12,
  },
  userCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  userInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  userName: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 23,
  },
  userEmail: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  metaText: {
    color: authPalette.muted,
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 19,
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
  outlineButton: {
    alignItems: 'center',
    borderColor: '#BDE7CF',
    borderRadius: 8,
    borderWidth: 1.4,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  outlineButtonText: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 14,
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
  paginationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.48,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardMeta: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  cardTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
    marginTop: 12,
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
  rejectionText: {
    backgroundColor: '#FDE7E6',
    borderRadius: 8,
    color: '#AE3F3A',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
    padding: 10,
  },
  helperText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 21,
  },
  errorText: {
    color: '#AE3F3A',
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 34,
  },
  emptyTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 17,
  },
  emptyText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 21,
  },
  restrictedTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 20,
  },
  restrictedBody: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
});
