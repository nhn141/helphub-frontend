import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  getSupportLocationById,
  type SupportLocationDetail,
} from '@/components/management/support-location-api';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementChoiceGroup,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import {
  assignSupportRequestToLocation,
  getSupportRequestById,
  getSupportRequests,
  type SupportRequestDetail,
} from '@/components/support-request/request-api';
import { UserAvatar } from '@/components/user/user-avatar';
import { useToast } from '@/components/ui/toast';
import { canManageSupportLocations } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SupportLocationAssignRequestScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const { session, user } = useAuth();
  const { showToast } = useToast();
  const canAssignLocation = Boolean(user?.role && canManageSupportLocations(user.role));
  const [location, setLocation] = useState<SupportLocationDetail | null>(null);
  const [requests, setRequests] = useState<SupportRequestDetail[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const detailRoute = {
    pathname: '/support-location-detail' as const,
    params: id ? { id } : undefined,
  };

  const loadAssignmentData = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!canAssignLocation) {
      setLocation(null);
      setRequests([]);
      return;
    }

    if (!id) {
      setError('Missing support location.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [locationData, approvedRequests] = await Promise.all([
        getSupportLocationById(session.accessToken, id),
        getSupportRequests(session.accessToken, 'APPROVED'),
      ]);
      const requestDetails = await Promise.all(
        approvedRequests.map(async (request) => {
          try {
            return await getSupportRequestById(session.accessToken, request.id);
          } catch {
            return null;
          }
        })
      );
      const assignableRequests = requestDetails.filter(
        (request): request is SupportRequestDetail => Boolean(request && !request.assignedSupportLocationId)
      );

      setLocation(locationData);
      setRequests(assignableRequests);
      setSelectedRequestId((current) => {
        if (current && assignableRequests.some((request) => request.id === current)) {
          return current;
        }

        return assignableRequests[0]?.id ?? '';
      });
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [canAssignLocation, id, session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadAssignmentData();
    }, [loadAssignmentData])
  );

  const selectedRequest = requests.find((request) => request.id === selectedRequestId);
  const isLocationInactive = location ? !location.isActive : false;

  const handleAssign = async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!canAssignLocation) {
      const message = 'Only collaborators and admins can assign support locations.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    if (!id || !selectedRequestId) {
      const message = 'Choose an approved request before assigning.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await assignSupportRequestToLocation(session.accessToken, selectedRequestId, id);
      showToast({ message: 'Support request assigned.', type: 'success' });
      router.replace(detailRoute);
    } catch (assignError) {
      const message = getAuthErrorMessage(assignError);
      setError(message);
      showToast({ message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canAssignLocation) {
    return (
      <ManagementScreen title="Assign Request" onBackPress={() => router.back()}>
        <ManagementCard>
          <Text style={styles.emptyTitle}>Collaborator or admin only</Text>
          <Text style={styles.helperText}>
            Support location assignment is available for users who coordinate request routing.
          </Text>
        </ManagementCard>
      </ManagementScreen>
    );
  }

  return (
    <ManagementScreen
      title="Assign Request"
      onBackPress={() => router.push(detailRoute)}
      rightSlot={
        location ? (
          <ManagementBadge
            label={location.isActive ? 'ACTIVE' : 'INACTIVE'}
            tone={location.isActive ? 'green' : 'slate'}
          />
        ) : undefined
      }>
      {isLoading ? <Text style={styles.helperText}>Loading assignment options...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {location ? (
        <ManagementSection title="Location Summary">
          <ManagementCard>
            <Text style={styles.title}>{location.name}</Text>
            <View style={styles.metaStack}>
              <ManagementMetaRow icon="map-pin" label="Address" value={location.address} />
              <ManagementMetaRow icon="phone" label="Phone" value={location.contactPhone ?? 'Not provided'} />
            </View>
          </ManagementCard>
        </ManagementSection>
      ) : null}

      <ManagementSection title="Support Request">
        {requests.length === 0 ? (
          <ManagementCard>
            <Text style={styles.emptyTitle}>No approved request available</Text>
            <Text style={styles.helperText}>Approved requests without a support location will appear here.</Text>
          </ManagementCard>
        ) : (
          <ManagementChoiceGroup
            label="Approved Requests"
            options={requests.map((request) => ({
              label: request.title,
              value: request.id,
              detail: `${request.requesterName} - ${request.address ?? 'No address'}`,
            }))}
            value={selectedRequestId}
            onChange={setSelectedRequestId}
          />
        )}
      </ManagementSection>

      {selectedRequest ? (
        <ManagementSection title="Request Summary">
          <ManagementCard>
            <View style={styles.requesterRow}>
              <UserAvatar
                name={selectedRequest.requesterName}
                size={36}
                style={styles.requesterAvatar}
                textSize={14}
                uri={selectedRequest.requesterAvatarUrl}
              />
              <View style={styles.requesterText}>
                <Text style={styles.requesterLabel}>Requester</Text>
                <Text style={styles.requesterName} numberOfLines={1}>
                  {selectedRequest.requesterName}
                </Text>
              </View>
            </View>
            <View style={styles.metaStack}>
              <ManagementMetaRow icon="grid" label="Category" value={selectedRequest.categoryName} />
              <ManagementMetaRow
                icon="map-pin"
                label="Address"
                value={selectedRequest.address ?? 'Not provided'}
              />
            </View>
          </ManagementCard>
        </ManagementSection>
      ) : null}

      <View style={styles.buttonStack}>
        <ManagementButton
          disabled={isSubmitting || isLoading || requests.length === 0 || isLocationInactive}
          label={isSubmitting ? 'Assigning...' : 'Assign Request'}
          onPress={handleAssign}
        />
        <ManagementButton
          disabled={isSubmitting}
          label="Back to Detail"
          onPress={() => router.push(detailRoute)}
          variant="outline"
        />
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
  requesterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  requesterAvatar: {
    backgroundColor: '#E6F4EB',
  },
  requesterText: {
    flex: 1,
    minWidth: 0,
  },
  requesterLabel: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  requesterName: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    marginTop: 2,
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
