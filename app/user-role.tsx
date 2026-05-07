import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { userDetail } from '@/components/management/user-mocks';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementChoiceGroup,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

const roleOptions = [
  { label: 'Requester', value: 'REQUESTER' },
  { label: 'Volunteer', value: 'VOLUNTEER' },
  { label: 'Collaborator', value: 'COLLABORATOR' },
  { label: 'Admin', value: 'ADMIN' },
];

export default function UserRoleScreen() {
  const router = useRouter();
  const [role, setRole] = useState(userDetail.role);

  return (
    <ManagementScreen
      title="Update Role"
      onBackPress={() => router.push('/user-detail')}
      rightSlot={<ManagementBadge label={role} tone={role === 'COLLABORATOR' ? 'amber' : 'green'} />}>
      <ManagementSection title="User Summary">
        <ManagementCard>
          <Text style={styles.name}>{userDetail.fullName}</Text>
          <View style={styles.metaStack}>
            <ManagementMetaRow icon="mail" label="Email" value={userDetail.email} />
            <ManagementMetaRow icon="shield" label="Current Role" value={userDetail.role} />
          </View>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection title="Choose Role">
        <ManagementChoiceGroup label="Role" options={roleOptions} value={role} onChange={setRole} />
      </ManagementSection>

      <View style={styles.buttonStack}>
        <ManagementButton label="Update Role" onPress={() => router.push('/user-detail')} />
        <ManagementButton label="Back to Detail" onPress={() => router.push('/user-detail')} variant="outline" />
      </View>
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 20,
    lineHeight: 28,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  metaStack: {
    marginTop: 18,
    gap: 14,
  },
  buttonStack: {
    gap: 12,
  },
});
