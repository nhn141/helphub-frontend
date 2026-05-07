import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { requestDetail } from '@/components/support-request/request-mocks';
import {
  RequestButton,
  RequestCard,
  RequestMetaRow,
  RequestScreen,
  RequestSection,
  RequestStatusBadge,
} from '@/components/support-request/request-ui';
import { authPalette } from '@/components/auth/auth-ui';
import { Fonts } from '@/constants/theme';

export default function SupportRequestApproveScreen() {
  const router = useRouter();

  return (
    <RequestScreen
      title="Approve Request"
      onBackPress={() => router.push('/support-request-detail')}
      rightSlot={<RequestStatusBadge status="PENDING" />}>
      <RequestSection title="Request Summary">
        <RequestCard>
          <Text style={styles.title}>{requestDetail.title}</Text>
          <View style={styles.metaStack}>
            <RequestMetaRow icon="grid" label="Category" value={requestDetail.categoryName} />
            <RequestMetaRow icon="user" label="Requester" value={requestDetail.requesterName} />
            <RequestMetaRow icon="map-pin" label="Address" value={requestDetail.address} />
          </View>
        </RequestCard>
      </RequestSection>

      <View style={styles.buttonStack}>
        <RequestButton label="Approve Request" onPress={() => router.push('/support-request-detail')} />
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
