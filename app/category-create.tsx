import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { createCategory } from '@/components/management/category-api';
import {
  ManagementButton,
  ManagementField,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

export default function CategoryCreateScreen() {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    if (!code.trim()) {
      setError('Category code is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const createdCategory = await createCategory(session.accessToken, {
        name: name.trim(),
        code: code.trim().toUpperCase(), // standardizing code format
        description: description.trim() || null,
        iconUrl: iconUrl.trim() || null,
      });

      router.replace({
        pathname: '/category-detail',
        params: { id: createdCategory.id },
      });
    } catch (createError) {
      setError(getAuthErrorMessage(createError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ManagementScreen title="Create Category" onBackPress={() => router.push('/(tabs)/categories')}>
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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonStack}>
        <ManagementButton
          disabled={isSubmitting}
          label={isSubmitting ? 'Creating...' : 'Create Category'}
          onPress={handleCreate}
        />
        <ManagementButton
          disabled={isSubmitting}
          label="Back to Categories"
          onPress={() => router.push('/(tabs)/categories')}
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
    marginHorizontal: 16,
    marginBottom: 8,
  },
});
