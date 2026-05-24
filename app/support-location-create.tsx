import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupportLocation } from '@/components/management/support-location-api';
import {
  ManagementButton,
  ManagementField,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

export default function SupportLocationCreateScreen() {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
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
      const createdLocation = await createSupportLocation(session.accessToken, {
        address: address.trim(),
        bankAccountNumber,
        bankName,
        contactPhone,
        description: description.trim(),
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        name: name.trim(),
      });

      router.replace({
        pathname: '/support-location-detail',
        params: { id: createdLocation.id },
      });
    } catch (createError) {
      setError(getAuthErrorMessage(createError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ManagementScreen
      title="Create Location"
      onBackPress={() => router.push('/(tabs)/support-locations')}>
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
              placeholder="10.76262"
              value={latitude}
            />
          </View>
          <View style={styles.coordinateField}>
            <ManagementField
              keyboardType="decimal-pad"
              label="Longitude"
              onChangeText={setLongitude}
              placeholder="106.66017"
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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonStack}>
        <ManagementButton
          disabled={isSubmitting}
          label={isSubmitting ? 'Creating...' : 'Create Location'}
          onPress={handleCreate}
        />
        <ManagementButton
          disabled={isSubmitting}
          label="Back to Locations"
          onPress={() => router.push('/(tabs)/support-locations')}
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
  errorText: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.rounded,
  },
});
