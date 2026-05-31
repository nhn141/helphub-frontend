import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import { Badge, DashboardScreen, SectionHeader, SurfaceCard } from '@/components/dashboard/tab-ui';
import { getCategories, type CategorySummary } from '@/components/management/category-api';
import { getRoleTone, type AppRole } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

export default function CategoriesTabScreen() {
  const { session, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoading(true);
    setError('');
    try {
      // Admin sees all categories, including inactive ones.
      const data = await getCategories(session.accessToken, false);
      setCategories(data);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  if (!isAdmin) {
    return (
      <DashboardScreen
        title="Categories"
        rightSlot={<Badge label={user?.role ?? 'GUEST'} tone={user?.role ? getRoleTone(user.role as AppRole) : 'slate'} />}>
        <SurfaceCard>
          <Text style={styles.restrictedTitle}>Admin only</Text>
          <Text style={styles.restrictedBody}>
            Category management belongs to the admin workspace.
          </Text>
        </SurfaceCard>
      </DashboardScreen>
    );
  }

  return (
    <DashboardScreen
      title="Categories"
      rightSlot={<Badge label={user?.role ?? ''} tone={user?.role ? getRoleTone(user.role as AppRole) : 'slate'} />}>

      <SectionHeader
        title="Category Directory"
        action={
          <Pressable
            accessibilityRole="button"
            style={styles.addButton}
            onPress={() => router.push('/category-create')}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addButtonText}>New</Text>
          </Pressable>
        }
      />

      {isLoading && <Text style={styles.helperText}>Loading categories...</Text>}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.grid}>
        {categories.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/category-detail', params: { id: item.id } })}>
            <SurfaceCard>
              <View style={styles.cardTop}>
                <Text style={styles.code}>{item.code}</Text>
                <Badge
                  label={item.isActive ? 'ACTIVE' : 'INACTIVE'}
                  tone={item.isActive ? 'green' : 'slate'}
                />
              </View>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.cardFooter}>
                <Feather name="arrow-right" size={14} color={authPalette.primaryDark} />
                <Text style={styles.openDetail}>Open detail</Text>
              </View>
            </SurfaceCard>
          </Pressable>
        ))}

        {!isLoading && categories.length === 0 && !error && (
          <SurfaceCard>
            <Text style={styles.emptyText}>No categories yet. Tap New to create one.</Text>
          </SurfaceCard>
        )}
      </View>
    </DashboardScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: authPalette.primaryDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addButtonText: {
    fontSize: 13,
    color: '#fff',
    fontFamily: Fonts.rounded,
    fontWeight: '600',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  code: {
    fontSize: 12,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  name: {
    marginTop: 12,
    fontSize: 17,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  openDetail: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  helperText: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  errorText: {
    fontSize: 14,
    color: '#AE3F3A',
    fontFamily: Fonts.rounded,
  },
  emptyText: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    lineHeight: 22,
  },
  restrictedTitle: {
    fontSize: 20,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  restrictedBody: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
});
