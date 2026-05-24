import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  getSupportLocations,
  type SupportLocationSummary,
} from '@/components/management/support-location-api';
import {
  assignSupportRequestToLocation,
  getSupportRequestById,
  type SupportRequestDetail,
} from '@/components/support-request/request-api';
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

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SupportRequestAssignLocationScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const { session } = useAuth();
  const [requestDetail, setRequestDetail] = useState<SupportRequestDetail | null>(null);
  const [locations, setLocations] = useState<SupportLocationSummary[]>([]);
  const [supportLocationId, setSupportLocationId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const detailRoute = {
    pathname: '/support-request-detail' as const,
    params: id ? { id } : undefined,
  };

  const loadAssignData = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!id) {
      setError('Missing support request id.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [requestData, locationData] = await Promise.all([
        getSupportRequestById(session.accessToken, id),
        getSupportLocations(session.accessToken, true),
      ]);

      setRequestDetail(requestData);
      setLocations(locationData);
      setSupportLocationId((current) => {
        if (current && locationData.some((location) => location.id === current)) {
          return current;
        }

        if (
          requestData.assignedSupportLocationId &&
          locationData.some((location) => location.id === requestData.assignedSupportLocationId)
        ) {
          return requestData.assignedSupportLocationId;
        }

        return locationData[0]?.id ?? '';
      });
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [id, session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadAssignData();
    }, [loadAssignData])
  );

  const handleAssign = async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!id || !supportLocationId) {
      setError('Choose an active support location before assigning.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await assignSupportRequestToLocation(session.accessToken, id, supportLocationId);
      router.replace(detailRoute);
    } catch (assignError) {
      setError(getAuthErrorMessage(assignError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAssign = requestDetail?.status === 'APPROVED';

  return (
    <RequestScreen
      title="Assign Location"
      onBackPress={() => router.push(detailRoute)}
      rightSlot={requestDetail ? <RequestStatusBadge status={requestDetail.status} /> : undefined}>
      {isLoading ? <Text style={styles.helperText}>Loading assignment options...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {requestDetail ? (
        <RequestSection title="Request Summary">
          <RequestCard>
            <Text style={styles.title}>{requestDetail.title}</Text>
            <View style={styles.metaStack}>
              <RequestMetaRow icon="grid" label="Category" value={requestDetail.categoryName} />
              <RequestMetaRow icon="user" label="Requester" value={requestDetail.requesterName} />
              <RequestMetaRow
                icon="map-pin"
                label="Address"
                value={requestDetail.address ?? 'Not provided'}
              />
            </View>
          </RequestCard>
        </RequestSection>
      ) : null}

      <RequestSection title="Support Location">
        {locations.length === 0 ? (
          <RequestCard>
            <Text style={styles.emptyTitle}>No active support location</Text>
            <Text style={styles.helperText}>Create or reactivate a support location before assigning.</Text>
          </RequestCard>
        ) : (
          <RequestChoiceGroup
            label="Support Location"
            onChange={setSupportLocationId}
            options={locations.map((item) => ({
              label: item.name,
              value: item.id,
              detail: `${item.address} - ${item.contactPhone ?? 'No phone'}`,
            }))}
            value={supportLocationId}
          />
        )}
      </RequestSection>

      <View style={styles.buttonStack}>
        <RequestButton
          disabled={isSubmitting || isLoading || !canAssign || locations.length === 0}
          label={isSubmitting ? 'Assigning...' : 'Assign Support Location'}
          onPress={handleAssign}
        />
        <RequestButton
          disabled={isSubmitting}
          label="Back to Detail"
          onPress={() => router.push(detailRoute)}
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
  helperText: {
    fontSize: 14,
    lineHeight: 21,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.rounded,
  },
  emptyTitle: {
    marginBottom: 8,
    fontSize: 16,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
});
