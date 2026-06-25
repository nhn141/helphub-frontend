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
  ManagementChoiceGroup,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import {
  getUserById,
  updateUserRole,
  type UserDetail,
  type UserRole,
} from '@/components/management/user-api';
import { useToast } from '@/components/ui/toast';
import { getRoleTone } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

const roleOptions = [
  { label: 'Requester', value: 'REQUESTER', detail: 'Can create and follow support requests' },
  { label: 'Volunteer', value: 'VOLUNTEER', detail: 'Can help with requests and volunteer posts' },
  { label: 'Collaborator', value: 'COLLABORATOR', detail: 'Can review requests and manage locations' },
  { label: 'Admin', value: 'ADMIN', detail: 'Can manage users, categories, and system data' },
];

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function UserRoleScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const { isLoading: isAuthLoading, session, user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [targetUser, setTargetUser] = useState<UserDetail | null>(null);
  const [role, setRole] = useState<UserRole>('REQUESTER');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';
  const detailRoute = {
    pathname: '/user-detail' as const,
    params: id ? { id } : undefined,
  };
  const roleChoices =
    targetUser?.role === 'VOLUNTEER'
      ? roleOptions.filter((option) => option.value !== 'COLLABORATOR')
      : roleOptions;

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
      setRole(data.role);
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

  const handleUpdateRole = async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!id || !targetUser) {
      const message = 'Missing user ID.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    if (role === targetUser.role) {
      const message = 'User already has this role.';
      setError(message);
      showToast({ message, type: 'info' });
      return;
    }

    if (targetUser.id === currentUser?.id && role !== 'ADMIN') {
      const message = 'Admin cannot change their own role.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    if (targetUser.role === 'VOLUNTEER' && role === 'COLLABORATOR') {
      const message = 'Volunteer upgrades to collaborator are handled through role upgrade requests.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await updateUserRole(session.accessToken, id, { role });
      showToast({ message: 'User role updated.', type: 'success' });
      router.replace(detailRoute);
    } catch (roleError) {
      const message = getAuthErrorMessage(roleError);
      setError(message);
      showToast({ message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin && !isAuthLoading) {
    return (
      <ManagementScreen title="Update Role" onBackPress={() => router.push('/(tabs)/system')}>
        <ManagementCard>
          <Text style={styles.restrictedTitle}>Admin only</Text>
          <Text style={styles.restrictedBody}>User management belongs to the admin workspace.</Text>
        </ManagementCard>
      </ManagementScreen>
    );
  }

  return (
    <ManagementScreen
      title="Update Role"
      onBackPress={() => router.push(detailRoute)}
      rightSlot={<ManagementBadge label={role} tone={getRoleTone(role)} />}>
      {isLoading ? <Text style={styles.helperText}>Loading user...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {targetUser ? (
        <ManagementSection title="User Summary">
          <ManagementCard>
            <Text style={styles.title}>{targetUser.fullName}</Text>
            <View style={styles.metaStack}>
              <ManagementMetaRow icon="mail" label="Email" value={targetUser.email} />
              <ManagementMetaRow icon="shield" label="Current Role" value={targetUser.role} />
            </View>
          </ManagementCard>
        </ManagementSection>
      ) : null}

      <ManagementSection title="Choose Role">
        <ManagementChoiceGroup
          label="Role"
          onChange={(value) => setRole(value as UserRole)}
          options={roleChoices}
          value={role}
        />
      </ManagementSection>

      {targetUser?.role === 'VOLUNTEER' ? (
        <ManagementSection title="Collaborator Upgrade">
          <ManagementCard>
            <Text style={styles.helperText}>
              Volunteer to collaborator changes are approved from submitted role upgrade requests.
            </Text>
            <View style={styles.requestButton}>
              <ManagementButton
                label="Open Requests"
                leftIcon={<Feather name="award" size={16} color={authPalette.primaryDark} />}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/system',
                    params: { section: 'manage-user', view: 'role-upgrades' },
                  })
                }
                variant="outline"
              />
            </View>
          </ManagementCard>
        </ManagementSection>
      ) : null}

      <View style={styles.buttonStack}>
        <ManagementButton
          disabled={isSubmitting || isLoading}
          label={isSubmitting ? 'Updating...' : 'Update Role'}
          onPress={handleUpdateRole}
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
  requestButton: {
    marginTop: 14,
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
