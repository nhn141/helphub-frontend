import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import {
  assignableSupportRequests,
  supportLocationDetail,
} from '@/components/management/support-location-mocks';
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

export default function SupportLocationAssignRequestScreen() {
  const router = useRouter();
  const [requestTitle, setRequestTitle] = useState(assignableSupportRequests[0].title);

  return (
    <ManagementScreen
      title="Assign Request"
      onBackPress={() => router.push('/support-location-detail')}
      rightSlot={<ManagementBadge label="APPROVED" tone="green" />}>
      <ManagementSection title="Location Summary">
        <ManagementCard>
          <Text style={styles.title}>{supportLocationDetail.name}</Text>
          <View style={styles.metaStack}>
            <ManagementMetaRow icon="grid" label="Category" value={supportLocationDetail.categoryName} />
            <ManagementMetaRow icon="map-pin" label="Address" value={supportLocationDetail.address} />
          </View>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection title="Support Request">
        <ManagementChoiceGroup
          label="Approved Requests"
          options={assignableSupportRequests.map((item) => ({
            label: item.title,
            value: item.title,
            detail: `${item.requesterName} • ${item.address}`,
          }))}
          value={requestTitle}
          onChange={setRequestTitle}
        />
      </ManagementSection>

      <View style={styles.buttonStack}>
        <ManagementButton label="Assign Request" onPress={() => router.push('/support-location-detail')} />
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
