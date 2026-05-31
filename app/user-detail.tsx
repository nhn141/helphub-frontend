import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementInlineLink,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import {
  formatUserDateTime,
  getUserById,
  type UserDetail,
} from '@/components/management/user-api';
import { UserAvatar } from '@/components/user/user-avatar';
import { getRoleTone } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function UserDetailScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const { isLoading: isAuthLoading, session, user: currentUser } = useAuth();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';
  const detailParams = id ? { id } : undefined;

  const loadUser = useCallback(async () => {
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

    if (!id) {
      setError('Missing user ID.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getUserById(session.accessToken, id);
      setUser(data);
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [id, isAdmin, isAuthLoading, session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  if (!isAdmin && !isAuthLoading) {
    return (
      <ManagementScreen title="User Detail" onBackPress={() => router.push('/users-list')}>
        <ManagementCard>
          <Text style={styles.restrictedTitle}>Admin only</Text>
          <Text style={styles.restrictedBody}>User management belongs to the admin workspace.</Text>
        </ManagementCard>
      </ManagementScreen>
    );
  }

  return (
    <ManagementScreen
      title="User Detail"
      onBackPress={() => router.push('/users-list')}
      rightSlot={
        user ? (
          <ManagementBadge
            label={user.isActive ? 'ACTIVE' : 'INACTIVE'}
            tone={user.isActive ? 'green' : 'slate'}
          />
        ) : undefined
      }>
      {isLoading ? <Text style={styles.helperText}>Loading user...</Text> : null}

      {error ? (
        <ManagementCard>
          <Text style={styles.errorTitle}>Could not load user</Text>
          <Text style={styles.helperText}>{error}</Text>
          <View style={styles.retryButton}>
            <ManagementButton label="Try Again" onPress={loadUser} variant="outline" />
          </View>
        </ManagementCard>
      ) : null}

      {user ? (
        <>
          <ManagementSection
            title="Profile"
            action={
              <ManagementInlineLink
                label="Role"
                onPress={() =>
                  router.push({
                    pathname: '/user-role',
                    params: detailParams,
                  })
                }
              />
            }>
            <ManagementCard>
              <View style={styles.profileTop}>
                <UserAvatar name={user.fullName} size={62} uri={user.avatarUrl} />
                <View style={styles.profileInfo}>
                  <Text style={styles.name}>{user.fullName}</Text>
                  <Text style={styles.email}>{user.email}</Text>
                </View>
              </View>

              <View style={styles.badgeRow}>
                <ManagementBadge label={user.role} tone={getRoleTone(user.role)} />
                <ManagementBadge
                  label={user.isActive ? 'ACTIVE' : 'INACTIVE'}
                  tone={user.isActive ? 'green' : 'slate'}
                />
              </View>
            </ManagementCard>
          </ManagementSection>

          <ManagementSection
            title="Account"
            action={
              <ManagementInlineLink
                label="Status"
                onPress={() =>
                  router.push({
                    pathname: '/user-status',
                    params: detailParams,
                  })
                }
              />
            }>
            <ManagementCard>
              <View style={styles.metaStack}>
                <ManagementMetaRow icon="mail" label="Email" value={user.email} />
                <ManagementMetaRow icon="phone" label="Phone" value={user.phone ?? 'Not provided'} />
                <ManagementMetaRow
                  icon="calendar"
                  label="Created"
                  value={formatUserDateTime(user.createdAt)}
                />
                <ManagementMetaRow
                  icon="edit"
                  label="Last updated"
                  value={formatUserDateTime(user.updatedAt)}
                />
                <ManagementMetaRow
                  icon="clock"
                  label="Last login"
                  value={formatUserDateTime(user.lastLoginAt)}
                />
              </View>
            </ManagementCard>
          </ManagementSection>

          <View style={styles.buttonStack}>
            <ManagementButton
              label="Update Role"
              leftIcon={<Feather name="shield" size={16} color="#fff" />}
              onPress={() =>
                router.push({
                  pathname: '/user-role',
                  params: detailParams,
                })
              }
            />
            <ManagementButton
              label="Update Status"
              leftIcon={<Feather name="toggle-left" size={16} color={authPalette.primaryDark} />}
              onPress={() =>
                router.push({
                  pathname: '/user-status',
                  params: detailParams,
                })
              }
              variant="outline"
            />
          </View>
        </>
      ) : null}
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileInfo: {
    flex: 1,
    gap: 5,
  },
  name: {
    fontSize: 21,
    lineHeight: 28,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontWeight: '700',
  },
  email: {
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
  metaStack: {
    gap: 14,
  },
  buttonStack: {
    gap: 12,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 21,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  errorTitle: {
    marginBottom: 8,
    fontSize: 16,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  retryButton: {
    marginTop: 16,
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
