import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  getSupportLocationById,
  updateSupportLocationStatus,
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
import { Fonts } from '@/constants/theme';

const statusOptions = [
  { label: 'Active', value: 'ACTIVE', detail: 'Available for request assignment' },
  { label: 'Inactive', value: 'INACTIVE', detail: 'Hidden from assignment flow' },
];

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SupportLocationStatusScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const { session } = useAuth();
  const [location, setLocation] = useState<SupportLocationDetail | null>(null);
  const [status, setStatus] = useState('ACTIVE');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const detailRoute = {
    pathname: '/support-location-detail' as const,
    params: id ? { id } : undefined,
  };

  const loadLocation = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!id) {
      setError('Missing support location id.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getSupportLocationById(session.accessToken, id);
      setLocation(data);
      setStatus(data.isActive ? 'ACTIVE' : 'INACTIVE');
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

  const handleUpdateStatus = async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!id) {
      setError('Missing support location id.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await updateSupportLocationStatus(session.accessToken, id, {
        isActive: status === 'ACTIVE',
      });

      router.replace(detailRoute);
    } catch (statusError) {
      setError(getAuthErrorMessage(statusError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ManagementScreen
      title="Update Status"
      onBackPress={() => router.push(detailRoute)}
      rightSlot={<ManagementBadge label={status} tone={status === 'ACTIVE' ? 'green' : 'slate'} />}>
      {isLoading ? <Text style={styles.helperText}>Loading support location...</Text> : null}
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

      <ManagementSection title="Choose Status">
        <ManagementChoiceGroup label="Status" options={statusOptions} value={status} onChange={setStatus} />
      </ManagementSection>

      <View style={styles.buttonStack}>
        <ManagementButton
          disabled={isSubmitting || isLoading}
          label={isSubmitting ? 'Updating...' : 'Update Status'}
          onPress={handleUpdateStatus}
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
});
