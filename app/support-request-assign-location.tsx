import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { requestDetail, supportLocations } from '@/components/support-request/request-mocks';
import {
  RequestButton,
  RequestCard,
  RequestChoiceGroup,
  RequestMetaRow,
  RequestScreen,
  RequestSection,
  RequestStatusBadge,
} from '@/components/support-request/request-ui';
import { Fonts } from '@/constants/theme';

export default function SupportRequestAssignLocationScreen() {
  const router = useRouter();
  const [supportLocationId, setSupportLocationId] = useState(requestDetail.assignedSupportLocationId);

  return (
    <RequestScreen
      title="Assign Location"
      onBackPress={() => router.push('/support-request-detail')}
      rightSlot={<RequestStatusBadge status={requestDetail.status} />}>
      <RequestSection title="Request Summary">
        <RequestCard>
          <Text style={styles.title}>{requestDetail.title}</Text>
          <View style={styles.metaStack}>
            <RequestMetaRow icon="grid" label="Category" value={requestDetail.categoryName} />
            <RequestMetaRow icon="map-pin" label="Address" value={requestDetail.address} />
          </View>
        </RequestCard>
      </RequestSection>

      <RequestSection title="Support Location">
        <RequestChoiceGroup
          label="Support Location"
          onChange={setSupportLocationId}
          options={supportLocations.map((item) => ({
            label: item.name,
            value: item.id,
            detail: item.address,
          }))}
          value={supportLocationId}
        />
      </RequestSection>

      <View style={styles.buttonStack}>
        <RequestButton
          label="Assign Support Location"
          onPress={() => router.push('/support-request-detail')}
        />
        <RequestButton
          label="Back to Detail"
          onPress={() => router.push('/support-request-detail')}
          variant="outline"
        />
      </View>
    </RequestScreen>
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
