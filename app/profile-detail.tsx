import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementInlineLink,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { UserAvatar } from '@/components/user/user-avatar';
import { Fonts } from '@/constants/theme';

export default function ProfileDetailScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const initials = (user?.fullName || user?.email || 'HH')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (!isAuthenticated || !user) {
    return (
      <ManagementScreen title="My Profile" onBackPress={() => router.push('/(tabs)/profile')}>
        <ManagementSection title="Overview">
          <ManagementCard>
            <Text style={styles.emptyText}>Please log in to view your live profile.</Text>
          </ManagementCard>
        </ManagementSection>
        <ManagementButton label="Back to Login" onPress={() => router.replace('/login' as never)} />
      </ManagementScreen>
    );
  }

  return (
    <ManagementScreen
      title="My Profile"
      onBackPress={() => router.push('/(tabs)/profile')}
      rightSlot={<ManagementBadge label={user.role} tone="green" />}>
      <ManagementSection title="Overview">
        <ManagementCard>
          <View style={styles.profileTop}>
            <UserAvatar
              fallback={initials || 'HH'}
              name={user.fullName}
              size={58}
              style={styles.avatar}
              textSize={18}
              uri={user.avatarUrl}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user.fullName}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>
          </View>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection
        title="Contact"
        action={<ManagementInlineLink label="Edit" onPress={() => router.push('/profile-edit')} />}>
        <ManagementCard>
          <View style={styles.metaStack}>
            <ManagementMetaRow icon="phone" label="Phone" value={user.phone ?? 'Not provided'} />
            <ManagementMetaRow
              icon="image"
              label="Avatar"
              value={user.avatarUrl ? 'Cloudinary image linked' : 'Not set'}
            />
          </View>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection title="Account">
        <ManagementCard>
          <View style={styles.metaStack}>
            <ManagementMetaRow icon="shield" label="Role" value={user.role} />
            <ManagementMetaRow
              icon="check-circle"
              label="Status"
              value={user.isActive ? 'Active' : 'Inactive'}
            />
            <ManagementMetaRow icon="clock" label="Last Login" value={user.lastLoginAt ?? 'Not available'} />
          </View>
        </ManagementCard>
      </ManagementSection>

      <View style={styles.buttonStack}>
        <ManagementButton label="Edit Profile" onPress={() => router.push('/profile-edit')} />
        <ManagementButton label="User Directory" onPress={() => router.push('/users-list')} variant="outline" />
      </View>
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DDF5E8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarText: {
    fontSize: 18,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  email: {
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  metaStack: {
    gap: 14,
  },
  buttonStack: {
    gap: 12,
  },
  emptyText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 21,
  },
});
