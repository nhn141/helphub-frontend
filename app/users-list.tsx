import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import {
  formatUserDateTime,
  getUsers,
  type PageResponse,
  type UserRole,
  type UserSummary,
} from '@/components/management/user-api';
import { UserAvatar } from '@/components/user/user-avatar';
import { getRoleTone } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

const roleOptions: { label: string; value: UserRole | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Requester', value: 'REQUESTER' },
  { label: 'Volunteer', value: 'VOLUNTEER' },
  { label: 'Collaborator', value: 'COLLABORATOR' },
  { label: 'Admin', value: 'ADMIN' },
];

export default function UsersListScreen() {
  const { isLoading: isAuthLoading, session, user } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [pageData, setPageData] = useState<PageResponse<UserSummary> | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  const loadUsers = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!isAdmin) {
      return;
    }

    setIsLoading(true);
    setError('');

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
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, isAuthLoading, keyword, page, roleFilter, session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  function handleSearch() {
    setPage(0);
    setKeyword(keywordInput.trim());
  }

  function handleClear() {
    setKeywordInput('');
    setKeyword('');
    setRoleFilter('ALL');
    setPage(0);
  }

  function handleRoleFilter(nextRole: UserRole | 'ALL') {
    setRoleFilter(nextRole);
    setPage(0);
  }

  if (!isAdmin && !isAuthLoading) {
    return (
      <ManagementScreen title="Users" onBackPress={() => router.push('/(tabs)/profile')}>
        <ManagementCard>
          <Text style={styles.restrictedTitle}>Admin only</Text>
          <Text style={styles.restrictedBody}>User management belongs to the admin workspace.</Text>
        </ManagementCard>
      </ManagementScreen>
    );
  }

  return (
    <ManagementScreen
      title="Users"
      onBackPress={() => router.push('/(tabs)/profile')}
      rightSlot={<ManagementBadge label={user?.role ?? 'ADMIN'} tone="slate" />}>
      <ManagementSection title="Directory">
        <ManagementCard>
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
            <Pressable accessibilityRole="button" onPress={handleSearch} style={styles.iconButton}>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.filterWrap}>
            {roleOptions.map((option) => {
              const selected = roleFilter === option.value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  onPress={() => handleRoleFilter(option.value)}
                  style={[styles.filterChip, selected && styles.filterChipActive]}>
                  <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {(keyword || roleFilter !== 'ALL') ? (
            <Pressable accessibilityRole="button" onPress={handleClear} style={styles.clearButton}>
              <Feather name="x" size={14} color={authPalette.primaryDark} />
              <Text style={styles.clearButtonText}>Clear filters</Text>
            </Pressable>
          ) : null}
        </ManagementCard>
      </ManagementSection>

      {isLoading ? <Text style={styles.helperText}>Loading users...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.userStack}>
        {users.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/user-detail', params: { id: item.id } })}>
            <ManagementCard>
              <View style={styles.userCardTop}>
                <UserAvatar name={item.fullName} size={46} uri={item.avatarUrl} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.fullName}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <Feather name="chevron-right" size={19} color={authPalette.primaryDark} />
              </View>

              <View style={styles.badgeRow}>
                <ManagementBadge label={item.role} tone={getRoleTone(item.role)} />
                <ManagementBadge
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
            </ManagementCard>
          </Pressable>
        ))}

        {!isLoading && users.length === 0 && !error ? (
          <ManagementCard>
            <Text style={styles.emptyText}>No users found.</Text>
          </ManagementCard>
        ) : null}
      </View>

      {pageData && pageData.totalPages > 0 ? (
        <View style={styles.paginationRow}>
          <ManagementButton
            disabled={isLoading || pageData.first}
            label="Previous"
            onPress={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
            variant="outline"
          />
          <View style={styles.pageBadge}>
            <Text style={styles.pageText}>
              {pageData.number + 1} / {pageData.totalPages}
            </Text>
          </View>
          <ManagementButton
            disabled={isLoading || pageData.last}
            label="Next"
            onPress={() => setPage((currentPage) => currentPage + 1)}
            variant="outline"
          />
        </View>
      ) : null}
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchShell: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: authPalette.field,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: authPalette.text,
    fontSize: 14,
    fontFamily: Fonts.rounded,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authPalette.primaryDark,
  },
  filterWrap: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    backgroundColor: '#EDF2ED',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: authPalette.primaryDark,
  },
  filterChipText: {
    fontSize: 12,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  clearButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  userStack: {
    gap: 12,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 17,
    lineHeight: 23,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 13,
    lineHeight: 18,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  badgeRow: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  helperText: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  errorText: {
    fontSize: 14,
    color: '#AE3F3A',
    fontFamily: Fonts.rounded,
  },
  emptyText: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pageBadge: {
    minHeight: 42,
    minWidth: 72,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF7F0',
    paddingHorizontal: 14,
  },
  pageText: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  restrictedTitle: {
    fontSize: 20,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  restrictedBody: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
});
