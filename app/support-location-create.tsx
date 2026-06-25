import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { createSupportLocation } from '@/components/management/support-location-api';
import {
  ManagementButton,
  ManagementCard,
  ManagementField,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { LocationPicker } from '@/components/map/location-picker';
import type { Coordinates } from '@/components/map/map-utils';
import { canManageSupportLocations } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

export default function SupportLocationCreateScreen() {
  const { session, user } = useAuth();
  const canCreateLocation = Boolean(user?.role && canManageSupportLocations(user.role));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinates | null>(null);
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

    if (!canCreateLocation) {
      setError('Only collaborators and admins can create support locations.');
      return;
    }

    if (!name.trim() || !description.trim() || !address.trim()) {
      setError('Name, description, and address are required.');
      return;
    }

    if (!selectedCoordinate) {
      setError('Search the address or choose a point on the map before creating.');
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
        latitude: selectedCoordinate.latitude,
        longitude: selectedCoordinate.longitude,
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

  if (!canCreateLocation) {
    return (
      <ManagementScreen
        title="Create Location"
        onBackPress={() => router.push('/(tabs)/map')}>
        <ManagementCard>
          <Text style={styles.restrictedTitle}>Collaborator or admin only</Text>
          <Text style={styles.helperText}>
            Support location creation is available for users who coordinate request assignment.
          </Text>
        </ManagementCard>
      </ManagementScreen>
    );
  }

  return (
    <ManagementScreen
      title="Create Location"
      onBackPress={() =>
        router.push({ pathname: '/(tabs)/support', params: { view: 'locations' } })
      }>
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
          helperText="Search the address and confirm the support location pin before saving."
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
          onPress={() =>
            router.push({ pathname: '/(tabs)/support', params: { view: 'locations' } })
          }
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
  errorText: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.rounded,
  },
  helperText: {
    color: '#657368',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  restrictedTitle: {
    color: '#20382A',
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
});
