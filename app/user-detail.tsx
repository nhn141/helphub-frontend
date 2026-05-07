import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { userDetail } from '@/components/management/user-mocks';
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

export default function UserDetailScreen() {
  const router = useRouter();

  return (
    <ManagementScreen
      title="User Detail"
      onBackPress={() => router.push('/users-list')}
      rightSlot={<ManagementBadge label={userDetail.role} tone={userDetail.role === 'COLLABORATOR' ? 'amber' : 'green'} />}>
      <ManagementSection title="Overview">
        <ManagementCard>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>BL</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{userDetail.fullName}</Text>
              <Text style={styles.email}>{userDetail.email}</Text>
            </View>
          </View>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection
        title="Contact"
        action={<ManagementInlineLink label="Role" onPress={() => router.push('/user-role')} />}>
        <ManagementCard>
          <View style={styles.metaStack}>
            <ManagementMetaRow icon="phone" label="Phone" value={userDetail.phone} />
            <ManagementMetaRow icon="clock" label="Last Login" value={userDetail.lastLoginAt} />
            <ManagementMetaRow icon="check-circle" label="Status" value={userDetail.isActive ? 'Active' : 'Inactive'} />
          </View>
        </ManagementCard>
      </ManagementSection>

      <View style={styles.buttonStack}>
        <ManagementButton label="Update Role" onPress={() => router.push('/user-role')} />
        <ManagementButton label="Update Status" onPress={() => router.push('/user-status')} variant="outline" />
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
