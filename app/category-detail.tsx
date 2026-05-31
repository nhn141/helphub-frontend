import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import { getCategoryById, type CategoryDetail } from '@/components/management/category-api';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementInlineLink,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function CategoryDetailScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams();
  const id = getStringParam(params.id);

  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCategory = useCallback(async () => {
    if (!session?.accessToken || !id) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await getCategoryById(session.accessToken, id);
      setCategory(data);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, id]);

  useFocusEffect(
    useCallback(() => {
      loadCategory();
    }, [loadCategory])
  );

  return (
    <ManagementScreen
      title="Category Detail"
      onBackPress={() => router.push('/(tabs)/categories')}
      rightSlot={
        category ? (
          <ManagementBadge
            label={category.isActive ? 'ACTIVE' : 'INACTIVE'}
            tone={category.isActive ? 'green' : 'slate'}
          />
        ) : undefined
      }>

      {isLoading && <Text style={styles.helperText}>Loading...</Text>}

      {error ? (
        <ManagementCard>
          <Text style={styles.errorText}>{error}</Text>
          <ManagementButton label="Try Again" onPress={loadCategory} variant="outline" />
        </ManagementCard>
      ) : null}

      {category ? (
        <>
          <ManagementSection
            title="Overview"
            action={
              <ManagementInlineLink
                label="Edit"
                onPress={() => router.push({ pathname: '/category-edit', params: { id: category.id } })}
              />
            }>
            <ManagementCard>
              <Text style={styles.code}>{category.code}</Text>
              <Text style={styles.title}>{category.name}</Text>
              {category.description ? (
                <Text style={styles.description}>{category.description}</Text>
              ) : (
                <Text style={styles.empty}>No description provided.</Text>
              )}
            </ManagementCard>
          </ManagementSection>

          <ManagementSection title="Metadata">
            <ManagementCard>
              <View style={styles.metaStack}>
                <ManagementMetaRow icon="calendar" label="Created" value={category.createdAt} />
                {category.updatedAt ? (
                  <ManagementMetaRow icon="edit" label="Last updated" value={category.updatedAt} />
                ) : null}
                {category.iconUrl ? (
                  <ManagementMetaRow icon="image" label="Icon URL" value={category.iconUrl} />
                ) : null}
              </View>
            </ManagementCard>
          </ManagementSection>

          <View style={styles.buttonStack}>
            <ManagementButton
              label="Update Status"
              variant="outline"
              leftIcon={<Feather name="toggle-left" size={16} color={authPalette.primaryDark} />}
              onPress={() => router.push({ pathname: '/category-status', params: { id: category.id } })}
            />
            <ManagementButton
              label="Edit Category"
              leftIcon={<Feather name="edit-2" size={16} color="#fff" />}
              onPress={() => router.push({ pathname: '/category-edit', params: { id: category.id } })}
            />
          </View>
        </>
      ) : null}
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  helperText: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  errorText: {
    fontSize: 14,
    color: '#AE3F3A',
    fontFamily: Fonts.rounded,
    marginBottom: 12,
  },
  code: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  title: {
    marginTop: 8,
    fontSize: 22,
    lineHeight: 30,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontWeight: 'bold',
  },
  description: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  empty: {
    marginTop: 12,
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontStyle: 'italic',
  },
  metaStack: {
    gap: 14,
  },
  buttonStack: {
    gap: 12,
  },
});
