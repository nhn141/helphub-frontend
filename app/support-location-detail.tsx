import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import { ShareItemSheet } from '@/components/chat/share-item-sheet';
import {
  formatCoordinate,
  getSupportLocationById,
  getSupportRequestsBySupportLocation,
  type SupportLocationDetail,
} from '@/components/management/support-location-api';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementInlineLink,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import {
  formatDateTime,
  getStatusTone,
  type SupportRequestSummary,
} from '@/components/support-request/request-api';
import { UserAvatar } from '@/components/user/user-avatar';
import { canManageSupportLocations } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SupportLocationDetailScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const { session, user } = useAuth();
  const canManageLocation = Boolean(user?.role && canManageSupportLocations(user.role));
  const [location, setLocation] = useState<SupportLocationDetail | null>(null);
  const [assignedRequests, setAssignedRequests] = useState<SupportRequestSummary[]>([]);
  const [assignedRequestsError, setAssignedRequestsError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShareSheetVisible, setIsShareSheetVisible] = useState(false);

  const loadLocation = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!id) {
      setError('Missing support location.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAssignedRequestsError('');

    try {
      const assignedRequestsResult = getSupportRequestsBySupportLocation(
        session.accessToken,
        id
      )
        .then((data) => ({ data, error: '' }))
        .catch((requestError) => ({
          data: [] as SupportRequestSummary[],
          error: getAuthErrorMessage(requestError),
        }));
      const data = await getSupportLocationById(session.accessToken, id);
      const requestsData = await assignedRequestsResult;

      setLocation(data);
      setAssignedRequests(requestsData.data);
      setAssignedRequestsError(requestsData.error);
    } catch (locationError) {
      setLocation(null);
      setAssignedRequests([]);
      setError(getAuthErrorMessage(locationError));
    } finally {
      setIsLoading(false);
    }
  }, [id, session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadLocation();
    }, [loadLocation])
  );

  const detailParams = id ? { id } : undefined;

  return (
    <ManagementScreen
      title="Support Location"
      onBackPress={() =>
        router.push({ pathname: '/(tabs)/support', params: { view: 'locations' } })
      }
      rightSlot={
        location ? (
          <ManagementBadge
            label={location.isActive ? 'ACTIVE' : 'INACTIVE'}
            tone={location.isActive ? 'green' : 'slate'}
          />
        ) : undefined
      }>
      {isLoading ? <Text style={styles.helperText}>Loading support location...</Text> : null}

      {error ? (
        <ManagementCard>
          <Text style={styles.emptyTitle}>Could not load location</Text>
          <Text style={styles.helperText}>{error}</Text>
          <View style={styles.retryButton}>
            <ManagementButton label="Try Again" onPress={loadLocation} variant="outline" />
          </View>
        </ManagementCard>
      ) : null}

      {location ? (
        <>
          <ManagementSection
            title="Overview"
            action={
              canManageLocation ? (
                <ManagementInlineLink
                  label="Edit"
                  onPress={() =>
                    router.push({
                      pathname: '/support-location-edit',
                      params: detailParams,
                    })
                  }
                />
              ) : undefined
            }>
            <ManagementCard>
              <Text style={styles.category}>Created by {location.createdByName}</Text>
              <Text style={styles.title}>{location.name}</Text>
              <Text style={styles.description}>{location.description}</Text>
              <View style={styles.shareButton}>
                <ManagementButton
                  label="Share to chat"
                  leftIcon={<Feather name="share-2" size={15} color={authPalette.primaryDark} />}
                  onPress={() => setIsShareSheetVisible(true)}
                  variant="outline"
                />
              </View>
            </ManagementCard>
          </ManagementSection>

          <ManagementSection
            title="Contact"
            action={
              canManageLocation ? (
                <ManagementInlineLink
                  label="Status"
                  onPress={() =>
                    router.push({
                      pathname: '/support-location-status',
                      params: detailParams,
                    })
                  }
                />
              ) : undefined
            }>
            <ManagementCard>
              <View style={styles.metaStack}>
                <ManagementMetaRow icon="map-pin" label="Address" value={location.address} />
                <ManagementMetaRow
                  icon="navigation"
                  label="Coordinates"
                  value={`${formatCoordinate(location.latitude)}, ${formatCoordinate(location.longitude)}`}
                />
                <ManagementMetaRow
                  icon="phone"
                  label="Phone"
                  value={location.contactPhone ?? 'Not provided'}
                />
              </View>
            </ManagementCard>
          </ManagementSection>

          <ManagementSection title="Funding">
            <ManagementCard>
              <View style={styles.metaStack}>
                <ManagementMetaRow
                  icon="credit-card"
                  label="Bank"
                  value={location.bankName ?? 'Not provided'}
                />
                <ManagementMetaRow
                  icon="hash"
                  label="Account Number"
                  value={location.bankAccountNumber ?? 'Not provided'}
                />
              </View>
            </ManagementCard>
          </ManagementSection>

          <ManagementSection
            title="Assigned Requests"
            action={
              canManageLocation ? (
                <ManagementInlineLink
                  label="Assign"
                  onPress={() =>
                    router.push({
                      pathname: '/support-location-assign-request',
                      params: detailParams,
                    })
                  }
                />
              ) : undefined
            }>
            {assignedRequestsError ? (
              <ManagementCard>
                <Text style={styles.emptyTitle}>Could not load assigned requests</Text>
                <Text style={styles.helperText}>{assignedRequestsError}</Text>
                <View style={styles.retryButton}>
                  <ManagementButton label="Try Again" onPress={loadLocation} variant="outline" />
                </View>
              </ManagementCard>
            ) : isLoading ? (
              <ManagementCard>
                <Text style={styles.emptyTitle}>Loading assigned requests</Text>
                <Text style={styles.helperText}>Fetching support requests routed to this location...</Text>
              </ManagementCard>
            ) : assignedRequests.length === 0 ? (
              <ManagementCard>
                <Text style={styles.emptyTitle}>No assigned requests yet</Text>
                <Text style={styles.helperText}>
                  Support requests assigned to this support location will appear here.
                </Text>
              </ManagementCard>
            ) : (
              <View style={styles.assignedRequestStack}>
                {assignedRequests.map((request) => (
                  <Pressable
                    key={request.id}
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: '/support-request-detail',
                        params: { id: request.id },
                      })
                    }>
                    <ManagementCard>
                      <View style={styles.requestCardTop}>
                        <ManagementBadge label={request.status} tone={getStatusTone(request.status)} />
                        <Text style={styles.requestDate}>{formatDateTime(request.createdAt)}</Text>
                      </View>
                      <Text style={styles.requestTitle}>{request.title}</Text>
                      <Text style={styles.requestCategory}>{request.categoryName}</Text>

                      <View style={styles.requesterInfo}>
                        <UserAvatar
                          name={request.requesterName}
                          size={34}
                          style={styles.requesterAvatar}
                          textSize={13}
                          uri={request.requesterAvatarUrl}
                        />
                        <View style={styles.requesterText}>
                          <Text style={styles.requesterLabel}>Requester</Text>
                          <Text style={styles.requesterName} numberOfLines={1}>
                            {request.requesterName}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.requestMetaLine}>
                        <Feather name="map-pin" size={14} color={authPalette.muted} />
                        <Text style={styles.requestMetaText} numberOfLines={2}>
                          {request.address ?? 'Not provided'}
                        </Text>
                      </View>

                      <View style={styles.openDetailRow}>
                        <Text style={styles.openDetailText}>Open detail</Text>
                        <Feather name="arrow-right" size={15} color={authPalette.primaryDark} />
                      </View>
                    </ManagementCard>
                  </Pressable>
                ))}
              </View>
            )}
          </ManagementSection>
        </>
      ) : null}

      {location ? (
        <ShareItemSheet
          itemId={location.id}
          itemTitle={location.name}
          itemType="LOCATION"
          onClose={() => setIsShareSheetVisible(false)}
          visible={isShareSheetVisible}
        />
      ) : null}
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  category: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  title: {
    marginTop: 8,
    fontSize: 22,
    lineHeight: 30,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  description: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  metaStack: {
    gap: 14,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 21,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  emptyTitle: {
    marginBottom: 8,
    fontSize: 16,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  retryButton: {
    marginTop: 16,
  },
  shareButton: {
    marginTop: 16,
  },
  assignedRequestStack: {
    gap: 12,
  },
  requestCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  requestDate: {
    color: authPalette.muted,
    flexShrink: 1,
    fontFamily: Fonts.rounded,
    fontSize: 12,
    textAlign: 'right',
  },
  requestTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 17,
    lineHeight: 24,
    marginTop: 12,
  },
  requestCategory: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    marginTop: 6,
  },
  requesterInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
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
  requestMetaLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  requestMetaText: {
    color: authPalette.muted,
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 21,
  },
  openDetailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  openDetailText: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
});
