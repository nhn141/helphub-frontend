import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { myProfile } from '@/components/management/user-mocks';
import {
  ManagementBadge,
  ManagementButton,
  ManagementField,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';

export default function ProfileEditScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState(myProfile.fullName);
  const [phone, setPhone] = useState(myProfile.phone);
  const [avatarUrl, setAvatarUrl] = useState(myProfile.avatarUrl);

  return (
    <ManagementScreen
      title="Edit Profile"
      onBackPress={() => router.push('/profile-detail')}
      rightSlot={<ManagementBadge label={myProfile.role} tone="green" />}>
      <ManagementSection title="Profile Info">
        <ManagementField label="Full Name" onChangeText={setFullName} value={fullName} />
        <ManagementField label="Phone" onChangeText={setPhone} value={phone} />
        <ManagementField label="Avatar URL" onChangeText={setAvatarUrl} value={avatarUrl} />
      </ManagementSection>

      <View style={styles.buttonStack}>
        <ManagementButton label="Save Profile" onPress={() => router.push('/profile-detail')} />
        <ManagementButton label="Cancel" onPress={() => router.push('/profile-detail')} variant="outline" />
      </View>
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  buttonStack: {
    gap: 12,
  },
});
