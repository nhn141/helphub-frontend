import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  createSupportRequest,
  getCategories,
  type CategorySummary,
} from '@/components/support-request/request-api';
import {
  RequestButton,
  RequestChoiceGroup,
  RequestField,
  RequestScreen,
  RequestSection,
} from '@/components/support-request/request-ui';
import { Fonts } from '@/constants/theme';

export default function SupportRequestCreateScreen() {
  const { session, user } = useAuth();
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const loadCategories = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    setIsLoadingCategories(true);
    setError('');

    try {
      const data = await getCategories(session.accessToken);
      setCategories(data);
    } catch (categoryError) {
      setError(getAuthErrorMessage(categoryError));
    } finally {
      setIsLoadingCategories(false);
    }
  }, [session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  async function handleCreateRequest() {
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const normalizedAddress = address.trim();

    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (user?.role !== 'REQUESTER') {
      setError('Only requester accounts can create support requests.');
      return;
    }

    if (!normalizedTitle || !normalizedDescription || !categoryId) {
      setError('Please enter a title, description, and category.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const createdRequest = await createSupportRequest(session.accessToken, {
        title: normalizedTitle,
        description: normalizedDescription,
        categoryId,
        address: normalizedAddress || undefined,
      });

      router.replace({
        pathname: '/support-request-detail',
        params: { id: createdRequest.id, from: 'my' },
      });
    } catch (createError) {
      setError(getAuthErrorMessage(createError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RequestScreen title="Create Request" onBackPress={() => router.push('/(tabs)/requests')}>
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
        {isLoadingCategories ? <Text style={styles.helperText}>Loading categories...</Text> : null}
        {categories.length === 0 && !isLoadingCategories ? (
          <Text style={styles.helperText}>No active categories available yet.</Text>
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
        <RequestField
          label="Address"
          onChangeText={setAddress}
          rightIcon={<Feather name="map-pin" size={18} color="#6E786F" />}
          value={address}
        />
      </RequestSection>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonStack}>
        <RequestButton
          disabled={isSubmitting || categories.length === 0}
          label={isSubmitting ? 'Creating...' : 'Create Request'}
          onPress={handleCreateRequest}
        />
        <RequestButton
          label="View My Requests"
          onPress={() => router.push('/support-request-my')}
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
