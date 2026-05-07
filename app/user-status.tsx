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

const statusOptions = [
  { label: 'Active', value: 'ACTIVE', detail: 'User can access the app normally' },
  { label: 'Inactive', value: 'INACTIVE', detail: 'User account is temporarily disabled' },
];

export default function UserStatusScreen() {
  const router = useRouter();
  const [status, setStatus] = useState(userDetail.isActive ? 'ACTIVE' : 'INACTIVE');

  return (
    <ManagementScreen
      title="Update Status"
      onBackPress={() => router.push('/user-detail')}
      rightSlot={<ManagementBadge label={status} tone={status === 'ACTIVE' ? 'green' : 'slate'} />}>
      <ManagementSection title="User Summary">
        <ManagementCard>
          <Text style={styles.name}>{userDetail.fullName}</Text>
          <View style={styles.metaStack}>
            <ManagementMetaRow icon="mail" label="Email" value={userDetail.email} />
            <ManagementMetaRow
              icon="check-circle"
              label="Current Status"
              value={userDetail.isActive ? 'Active' : 'Inactive'}
            />
          </View>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection title="Choose Status">
        <ManagementChoiceGroup label="Status" options={statusOptions} value={status} onChange={setStatus} />
      </ManagementSection>

      <View style={styles.buttonStack}>
        <ManagementButton label="Update Status" onPress={() => router.push('/user-detail')} />
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
