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
  ManagementChoiceGroup,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import {
  getUserById,
  updateUserStatus,
  type UserDetail,
} from '@/components/management/user-api';
import { Fonts } from '@/constants/theme';

const statusOptions = [
  { label: 'Active', value: 'ACTIVE', detail: 'User can sign in and use the platform' },
  { label: 'Inactive', value: 'INACTIVE', detail: 'User is blocked from active account access' },
];

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function UserStatusScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const { isLoading: isAuthLoading, session, user: currentUser } = useAuth();
  const [targetUser, setTargetUser] = useState<UserDetail | null>(null);
  const [status, setStatus] = useState('ACTIVE');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';
  const detailRoute = {
    pathname: '/user-detail' as const,
    params: id ? { id } : undefined,
  };

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
      setTargetUser(data);
      setStatus(data.isActive ? 'ACTIVE' : 'INACTIVE');
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

  const handleUpdateStatus = async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!id || !targetUser) {
      setError('Missing user ID.');
      return;
    }

    const isActive = status === 'ACTIVE';

    if (isActive === targetUser.isActive) {
      setError('User status is already set to this value.');
      return;
    }

    if (targetUser.id === currentUser?.id && !isActive) {
      setError('Admin cannot deactivate their own account.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await updateUserStatus(session.accessToken, id, { isActive });
      router.replace(detailRoute);
    } catch (statusError) {
      setError(getAuthErrorMessage(statusError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin && !isAuthLoading) {
    return (
      <ManagementScreen title="Update Status" onBackPress={() => router.push('/users-list')}>
        <ManagementCard>
          <Text style={styles.restrictedTitle}>Admin only</Text>
          <Text style={styles.restrictedBody}>User management belongs to the admin workspace.</Text>
        </ManagementCard>
      </ManagementScreen>
    );
  }

  return (
    <ManagementScreen
      title="Update Status"
      onBackPress={() => router.push(detailRoute)}
      rightSlot={<ManagementBadge label={status} tone={status === 'ACTIVE' ? 'green' : 'slate'} />}>
      {isLoading ? <Text style={styles.helperText}>Loading user...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {targetUser ? (
        <ManagementSection title="User Summary">
          <ManagementCard>
            <Text style={styles.title}>{targetUser.fullName}</Text>
            <View style={styles.metaStack}>
              <ManagementMetaRow icon="mail" label="Email" value={targetUser.email} />
              <ManagementMetaRow
                icon="toggle-left"
                label="Current Status"
                value={targetUser.isActive ? 'ACTIVE' : 'INACTIVE'}
              />
            </View>
          </ManagementCard>
        </ManagementSection>
      ) : null}

      <ManagementSection title="Choose Status">
        <ManagementChoiceGroup
          label="Status"
          onChange={setStatus}
          options={statusOptions}
          value={status}
        />
      </ManagementSection>

      <View style={styles.buttonStack}>
        <ManagementButton
          disabled={isSubmitting || isLoading}
          label={isSubmitting ? 'Updating...' : 'Update Status'}
          onPress={handleUpdateStatus}
        />
        <ManagementButton
          disabled={isSubmitting}
          label="Back to Detail"
          onPress={() => router.push(detailRoute)}
          variant="outline"
        />
      </View>
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    lineHeight: 28,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontWeight: '700',
  },
  metaStack: {
    marginTop: 18,
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
    marginHorizontal: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.rounded,
    marginHorizontal: 16,
    marginBottom: 8,
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
