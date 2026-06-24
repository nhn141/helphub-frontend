import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import { LocationPicker } from '@/components/map/location-picker';
import { isValidCoordinate, type Coordinates } from '@/components/map/map-utils';
import {
  getCategories,
  getSupportRequestById,
  updateSupportRequest,
  type CategorySummary,
  type SupportRequestDetail,
} from '@/components/support-request/request-api';
import {
  RequestButton,
  RequestChoiceGroup,
  RequestField,
  RequestScreen,
  RequestSection,
  RequestStatusBadge,
} from '@/components/support-request/request-ui';
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SupportRequestEditScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const { session, user } = useAuth();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [requestDetail, setRequestDetail] = useState<SupportRequestDetail | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinates | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEditData = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!id) {
      setError('Missing support request.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [categoryData, detailData] = await Promise.all([
        getCategories(session.accessToken),
        getSupportRequestById(session.accessToken, id),
      ]);

      setCategories(categoryData);
      setRequestDetail(detailData);
      setTitle(detailData.title);
      setDescription(detailData.description);
      setCategoryId(detailData.categoryId);
      setAddress(detailData.address ?? '');
      setSelectedCoordinate(
        isValidCoordinate(detailData.latitude, detailData.longitude)
          ? {
              latitude: Number(detailData.latitude),
              longitude: Number(detailData.longitude),
            }
          : null
      );
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [id, session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadEditData();
    }, [loadEditData])
  );

  async function handleSaveChanges() {
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const normalizedAddress = address.trim();

    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!id || !requestDetail) {
      setError('Missing support request detail.');
      return;
    }

    if (user?.id !== requestDetail.requesterId || user.role !== 'REQUESTER') {
      setError('You can only edit your own requester support requests.');
      return;
    }

    if (requestDetail.status !== 'PENDING') {
      setError('Only pending support requests can be updated.');
      return;
    }

    if (!normalizedTitle || !normalizedDescription || !categoryId) {
      setError('Please enter a title, description, and category.');
      return;
    }

    if (normalizedAddress && !selectedCoordinate) {
      setError('Search the address or choose a point on the map before saving.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const updatedRequest = await updateSupportRequest(session.accessToken, id, {
        title: normalizedTitle,
        description: normalizedDescription,
        categoryId,
        address: normalizedAddress || undefined,
        latitude: selectedCoordinate?.latitude,
        longitude: selectedCoordinate?.longitude,
      });

      router.replace({
        pathname: '/support-request-detail',
        params: { id: updatedRequest.id, from: 'my' },
      });
    } catch (saveError) {
      setError(getAuthErrorMessage(saveError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RequestScreen
      title="Edit Request"
      onBackPress={() =>
        router.push({
          pathname: '/support-request-detail',
          params: id ? { id, from: 'my' } : undefined,
        })
      }
      rightSlot={requestDetail ? <RequestStatusBadge status={requestDetail.status} /> : undefined}>
      {isLoading ? <Text style={styles.helperText}>Loading request...</Text> : null}

      <RequestSection title="Request Details">
        <RequestField label="Title" onChangeText={setTitle} value={title} />
        <RequestField
          label="Description"
          multiline
          numberOfLines={5}
          onChangeText={setDescription}
          value={description}
        />
      </RequestSection>

      <RequestSection title="Category">
        {categories.length === 0 ? (
          <Text style={styles.helperText}>No active categories available.</Text>
        ) : (
          <RequestChoiceGroup
            label="Category"
            onChange={setCategoryId}
            options={categories.map((item) => ({
              label: item.name,
              value: item.id,
              detail: item.code,
            }))}
            value={categoryId}
          />
        )}
      </RequestSection>

      <RequestSection title="Location">
        <LocationPicker
          address={address}
          coordinate={selectedCoordinate}
          disabled={isLoading}
          helperText="Search an address to match it on the map, or adjust the existing pin."
          onAddressChange={setAddress}
          onCoordinateChange={setSelectedCoordinate}
        />
      </RequestSection>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonStack}>
        <RequestButton
          disabled={isSubmitting || isLoading || categories.length === 0}
          label={isSubmitting ? 'Saving...' : 'Save Changes'}
          onPress={handleSaveChanges}
        />
        <RequestButton
          label="Cancel"
          onPress={() =>
            router.push({
              pathname: '/support-request-detail',
              params: id ? { id, from: 'my' } : undefined,
            })
          }
          variant="outline"
        />
      </View>
    </RequestScreen>
  );
}

const styles = StyleSheet.create({
  buttonStack: {
    gap: 12,
    marginTop: 4,
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
