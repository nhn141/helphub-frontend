import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  formatCoordinate,
  getSupportLocationById,
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
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SupportLocationDetailScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const { session } = useAuth();
  const [location, setLocation] = useState<SupportLocationDetail | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    try {
      const data = await getSupportLocationById(session.accessToken, id);
      setLocation(data);
    } catch (locationError) {
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
      onBackPress={() => router.push('/(tabs)/support-locations')}
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
              <ManagementInlineLink
                label="Edit"
                onPress={() =>
                  router.push({
                    pathname: '/support-location-edit',
                    params: detailParams,
                  })
                }
              />
            }>
            <ManagementCard>
              <Text style={styles.category}>Created by {location.createdByName}</Text>
              <Text style={styles.title}>{location.name}</Text>
              <Text style={styles.description}>{location.description}</Text>
            </ManagementCard>
          </ManagementSection>

          <ManagementSection
            title="Contact"
            action={
              <ManagementInlineLink
                label="Status"
                onPress={() =>
                  router.push({
                    pathname: '/support-location-status',
                    params: detailParams,
                  })
                }
              />
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
            title="Assignments">
            <ManagementButton
              label="Assign Request"
              onPress={() =>
                router.push({
                  pathname: '/support-location-assign-request',
                  params: detailParams,
                })
              }
            />
          </ManagementSection>
        </>
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
});
