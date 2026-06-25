import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  getCategoryById,
  updateCategory,
  type CategoryDetail,
} from '@/components/management/category-api';
import {
  ManagementBadge,
  ManagementButton,
  ManagementField,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { useToast } from '@/components/ui/toast';
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function CategoryEditScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const { session } = useAuth();
  const { showToast } = useToast();

  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const detailRoute = {
    pathname: '/category-detail' as const,
    params: id ? { id } : undefined,
  };

  const loadCategory = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!id) {
      setError('Missing category ID.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getCategoryById(session.accessToken, id);
      setCategory(data);
      setName(data.name);
      setCode(data.code);
      setDescription(data.description ?? '');
      setIconUrl(data.iconUrl ?? '');
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [id, session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadCategory();
    }, [loadCategory])
  );

  const handleSave = async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!id) {
      const message = 'Missing category ID.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    if (!name.trim()) {
      const message = 'Category name is required.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    if (!code.trim()) {
      const message = 'Category code is required.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await updateCategory(session.accessToken, id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
        iconUrl: iconUrl.trim() || null,
      });

      showToast({ message: 'Category updated.', type: 'success' });
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
      title="Edit Category"
      onBackPress={() => router.push(detailRoute)}
      rightSlot={
        category ? (
          <ManagementBadge
            label={category.isActive ? 'ACTIVE' : 'INACTIVE'}
            tone={category.isActive ? 'green' : 'slate'}
          />
        ) : undefined
      }>
      {isLoading ? <Text style={styles.helperText}>Loading category...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ManagementSection title="Category Info">
        <ManagementField label="Name" onChangeText={setName} value={name} />
        <ManagementField label="Code" onChangeText={setCode} placeholder="e.g. MEDICAL, FOOD" value={code} />
        <ManagementField
          label="Description"
          multiline
          numberOfLines={5}
          onChangeText={setDescription}
          value={description}
        />
        <ManagementField label="Icon URL" onChangeText={setIconUrl} value={iconUrl} />
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
    marginHorizontal: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.rounded,
    marginHorizontal: 16,
    marginBottom: 8,
  },
});
