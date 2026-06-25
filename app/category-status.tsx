import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  getCategoryById,
  updateCategoryStatus,
  type CategoryDetail,
} from '@/components/management/category-api';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementChoiceGroup,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { useToast } from '@/components/ui/toast';
import { Fonts } from '@/constants/theme';

const statusOptions = [
  { label: 'Active', value: 'ACTIVE', detail: 'Visible for requests and posts' },
  { label: 'Inactive', value: 'INACTIVE', detail: 'Hidden from active category selection' },
];

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function CategoryStatusScreen() {
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);
  const { session } = useAuth();
  const { showToast } = useToast();

  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [status, setStatus] = useState('ACTIVE');
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
      const message = 'Missing category ID.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getCategoryById(session.accessToken, id);
      setCategory(data);
      setStatus(data.isActive ? 'ACTIVE' : 'INACTIVE');
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [id, session?.accessToken, showToast]);

  useFocusEffect(
    useCallback(() => {
      loadCategory();
    }, [loadCategory])
  );

  const handleUpdateStatus = async () => {
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

    setIsSubmitting(true);
    setError('');

    try {
      await updateCategoryStatus(session.accessToken, id, {
        isActive: status === 'ACTIVE',
      });

      showToast({ message: 'Category status updated.', type: 'success' });
      router.replace(detailRoute);
    } catch (statusError) {
      const message = getAuthErrorMessage(statusError);
      setError(message);
      showToast({ message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ManagementScreen
      title="Update Status"
      onBackPress={() => router.push(detailRoute)}
      rightSlot={<ManagementBadge label={status} tone={status === 'ACTIVE' ? 'green' : 'slate'} />}>
      {isLoading ? <Text style={styles.helperText}>Loading category...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {category ? (
        <ManagementSection title="Category Summary">
          <ManagementCard>
            <Text style={styles.title}>{category.name}</Text>
            <View style={styles.metaStack}>
              <ManagementMetaRow icon="tag" label="Code" value={category.code} />
              <ManagementMetaRow icon="refresh-cw" label="Current Status" value={category.isActive ? 'ACTIVE' : 'INACTIVE'} />
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
