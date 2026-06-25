import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  getSupportLocationById,
  updateSupportLocation,
  type SupportLocationDetail,
} from '@/components/management/support-location-api';
import {
  ManagementBadge,
  ManagementButton,
  ManagementField,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { LocationPicker } from '@/components/map/location-picker';
import { isValidCoordinate, type Coordinates } from '@/components/map/map-utils';
import { useToast } from '@/components/ui/toast';
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SupportLocationEditScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const { session } = useAuth();
  const { showToast } = useToast();
  const [location, setLocation] = useState<SupportLocationDetail | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinates | null>(null);
  const [contactPhone, setContactPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
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
      setError('Missing support location.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getSupportLocationById(session.accessToken, id);
      setLocation(data);
      setName(data.name);
      setDescription(data.description);
      setAddress(data.address);
      setSelectedCoordinate(
        isValidCoordinate(data.latitude, data.longitude)
          ? {
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
            }
          : null
      );
      setContactPhone(data.contactPhone ?? '');
      setBankName(data.bankName ?? '');
      setBankAccountNumber(data.bankAccountNumber ?? '');
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

  const handleSave = async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!id) {
      const message = 'Missing support location.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    if (!name.trim() || !description.trim() || !address.trim()) {
      const message = 'Name, description, and address are required.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    if (!selectedCoordinate) {
      const message = 'Search the address or choose a point on the map before saving.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await updateSupportLocation(session.accessToken, id, {
        address: address.trim(),
        bankAccountNumber,
        bankName,
        contactPhone,
        description: description.trim(),
        latitude: selectedCoordinate.latitude,
        longitude: selectedCoordinate.longitude,
        name: name.trim(),
      });

      showToast({ message: 'Support location updated.', type: 'success' });
      router.replace(detailRoute);
    } catch (saveError) {
      const message = getAuthErrorMessage(saveError);
      setError(message);
      showToast({ message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ManagementScreen
      title="Edit Location"
      onBackPress={() => router.push(detailRoute)}
      rightSlot={
        location ? (
          <ManagementBadge
            label={location.isActive ? 'ACTIVE' : 'INACTIVE'}
            tone={location.isActive ? 'green' : 'slate'}
          />
        ) : undefined
      }>
      {isLoading ? <Text style={styles.helperText}>Loading support location...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ManagementSection title="Location Info">
        <ManagementField label="Name" onChangeText={setName} value={name} />
        <ManagementField
          label="Description"
          multiline
          numberOfLines={5}
          onChangeText={setDescription}
          value={description}
        />
        <LocationPicker
          address={address}
          coordinate={selectedCoordinate}
          disabled={isLoading}
          helperText="Search the address and adjust the support location pin before saving."
          onAddressChange={setAddress}
          onCoordinateChange={setSelectedCoordinate}
        />
        <ManagementField label="Contact Phone" onChangeText={setContactPhone} value={contactPhone} />
        <ManagementField label="Bank Name" onChangeText={setBankName} value={bankName} />
        <ManagementField
          label="Bank Account Number"
          onChangeText={setBankAccountNumber}
          value={bankAccountNumber}
        />
      </ManagementSection>

      <View style={styles.buttonStack}>
        <ManagementButton
          disabled={isSubmitting || isLoading}
          label={isSubmitting ? 'Saving...' : 'Save Changes'}
          onPress={handleSave}
        />
        <ManagementButton
          disabled={isSubmitting}
          label="Cancel"
          onPress={() => router.push(detailRoute)}
          variant="outline"
        />
      </View>
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
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
