import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  getSupportRequestById,
  rejectSupportRequest,
  type SupportRequestDetail,
} from '@/components/support-request/request-api';
import {
  RequestButton,
  RequestCard,
  RequestField,
  RequestMetaRow,
  RequestScreen,
  RequestSection,
  RequestStatusBadge,
} from '@/components/support-request/request-ui';
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SupportRequestRejectScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const [requestDetail, setRequestDetail] = useState<SupportRequestDetail | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const detailRoute = id
    ? ({
        pathname: '/support-request-detail' as const,
        params: { id },
      } as const)
    : ('/(tabs)/support' as const);

  const loadRequestDetail = useCallback(async () => {
    if (!session?.accessToken || !id) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getSupportRequestById(session.accessToken, id);
      setRequestDetail(data);
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [id, session?.accessToken]);

  useEffect(() => {
    loadRequestDetail();
  }, [loadRequestDetail]);

  async function handleReject() {
    if (!session?.accessToken || !id) {
      return;
    }

    const rejectionReason = reason.trim();

    if (!rejectionReason) {
      setError('Rejection reason is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await rejectSupportRequest(session.accessToken, id, rejectionReason);
      router.push(detailRoute as never);
    } catch (rejectError) {
      setError(getAuthErrorMessage(rejectError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RequestScreen
      title="Reject Request"
      onBackPress={() => router.push(detailRoute as never)}
      rightSlot={requestDetail ? <RequestStatusBadge status={requestDetail.status} /> : undefined}>
      <RequestSection title="Request Summary">
        <RequestCard>
          {isLoading ? <Text style={styles.helperText}>Loading request...</Text> : null}
          {requestDetail ? (
            <>
              <Text style={styles.title}>{requestDetail.title}</Text>
              <View style={styles.metaStack}>
                <RequestMetaRow icon="grid" label="Category" value={requestDetail.categoryName} />
                <RequestMetaRow icon="user" label="Requester" value={requestDetail.requesterName} />
                <RequestMetaRow
                  icon="map-pin"
                  label="Address"
                  value={requestDetail.address ?? 'No address provided'}
                />
              </View>
            </>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </RequestCard>
      </RequestSection>

      <RequestSection title="Rejection Reason">
        <RequestField
          label="Reason"
          multiline
          numberOfLines={4}
          onChangeText={setReason}
          placeholder="Write the reason for rejection"
          value={reason}
        />
      </RequestSection>

      <View style={styles.buttonStack}>
        <RequestButton
          label="Reject Request"
          onPress={handleReject}
          variant="danger"
          disabled={isSubmitting || !requestDetail}
        />
        <RequestButton
          label="Back to Detail"
          onPress={() => router.push(detailRoute as never)}
          variant="outline"
        />
      </View>
    </RequestScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 20,
    lineHeight: 28,
  },
  metaStack: {
    gap: 14,
    marginTop: 18,
  },
  helperText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#AE3F3A',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 14,
  },
  buttonStack: {
    gap: 12,
  },
});
