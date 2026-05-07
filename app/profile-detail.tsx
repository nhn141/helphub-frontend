import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { myProfile } from '@/components/management/user-mocks';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementInlineLink,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

export default function ProfileDetailScreen() {
  const router = useRouter();

  return (
    <ManagementScreen
      title="My Profile"
      onBackPress={() => router.push('/(tabs)/profile')}
      rightSlot={<ManagementBadge label={myProfile.role} tone="green" />}>
      <ManagementSection title="Overview">
        <ManagementCard>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>NH</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{myProfile.fullName}</Text>
              <Text style={styles.email}>{myProfile.email}</Text>
            </View>
          </View>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection
        title="Contact"
        action={<ManagementInlineLink label="Edit" onPress={() => router.push('/profile-edit')} />}>
        <ManagementCard>
          <View style={styles.metaStack}>
            <ManagementMetaRow icon="phone" label="Phone" value={myProfile.phone} />
            <ManagementMetaRow icon="image" label="Avatar" value="Profile image linked" />
          </View>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection title="Account">
        <ManagementCard>
          <View style={styles.metaStack}>
            <ManagementMetaRow icon="shield" label="Role" value={myProfile.role} />
            <ManagementMetaRow
              icon="check-circle"
              label="Status"
              value={myProfile.isActive ? 'Active' : 'Inactive'}
            />
            <ManagementMetaRow icon="clock" label="Last Login" value={myProfile.lastLoginAt} />
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
});
