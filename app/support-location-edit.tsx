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
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SupportLocationEditScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const { session } = useAuth();
  const [location, setLocation] = useState<SupportLocationDetail | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
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
      setLatitude(data.latitude == null ? '' : String(data.latitude));
      setLongitude(data.longitude == null ? '' : String(data.longitude));
      setAddress(data.address);
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
      setError('Missing support location.');
      return;
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (!name.trim() || !description.trim() || !address.trim()) {
      setError('Name, description, and address are required.');
      return;
    }

    if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
      setError('Latitude must be a number between -90 and 90.');
      return;
    }

    if (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
      setError('Longitude must be a number between -180 and 180.');
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
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        name: name.trim(),
      });

      router.replace(detailRoute);
    } catch (saveError) {
      setError(getAuthErrorMessage(saveError));
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
        <ManagementField label="Address" onChangeText={setAddress} value={address} />
        <View style={styles.coordinateRow}>
          <View style={styles.coordinateField}>
            <ManagementField
              keyboardType="decimal-pad"
              label="Latitude"
              onChangeText={setLatitude}
              value={latitude}
            />
          </View>
          <View style={styles.coordinateField}>
            <ManagementField
              keyboardType="decimal-pad"
              label="Longitude"
              onChangeText={setLongitude}
              value={longitude}
            />
          </View>
        </View>
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
  coordinateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateField: {
    flex: 1,
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
