import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { supportLocationDetail } from '@/components/management/support-location-mocks';
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
  { label: 'Active', value: 'ACTIVE', detail: 'Available for request assignment' },
  { label: 'Inactive', value: 'INACTIVE', detail: 'Hidden from assignment flow' },
];

export default function SupportLocationStatusScreen() {
  const router = useRouter();
  const [status, setStatus] = useState(supportLocationDetail.isActive ? 'ACTIVE' : 'INACTIVE');

  return (
    <ManagementScreen
      title="Update Status"
      onBackPress={() => router.push('/support-location-detail')}
      rightSlot={<ManagementBadge label={status} tone={status === 'ACTIVE' ? 'green' : 'slate'} />}>
      <ManagementSection title="Location Summary">
        <ManagementCard>
          <Text style={styles.title}>{supportLocationDetail.name}</Text>
          <View style={styles.metaStack}>
            <ManagementMetaRow icon="grid" label="Category" value={supportLocationDetail.categoryName} />
            <ManagementMetaRow icon="map-pin" label="Address" value={supportLocationDetail.address} />
          </View>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection title="Choose Status">
        <ManagementChoiceGroup label="Status" options={statusOptions} value={status} onChange={setStatus} />
      </ManagementSection>

      <View style={styles.buttonStack}>
        <ManagementButton label="Update Status" onPress={() => router.push('/support-location-detail')} />
        <ManagementButton label="Back to Detail" onPress={() => router.push('/support-location-detail')} variant="outline" />
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
  },
  metaStack: {
    marginTop: 18,
    gap: 14,
  },
  buttonStack: {
    gap: 12,
  },
});
