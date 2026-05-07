import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, DashboardScreen, SectionHeader, SurfaceCard } from '@/components/dashboard/tab-ui';
import { authPalette } from '@/components/auth/auth-ui';
import { useDemoRole } from '@/components/demo-role/demo-role-provider';
import { canManageCategories, getRoleTone } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

const categories = [
  { code: 'FOOD', name: 'Food Support', active: true },
  { code: 'MED', name: 'Medical', active: true },
  { code: 'TRN', name: 'Transport', active: true },
  { code: 'EDU', name: 'Education', active: true },
  { code: 'SHEL', name: 'Shelter', active: false },
  { code: 'FUND', name: 'Fundraising', active: true },
];

export default function CategoriesTabScreen() {
  const router = useRouter();
  const { role } = useDemoRole();
  const isAdmin = canManageCategories(role);

  if (!isAdmin) {
    return (
      <DashboardScreen
        title="Categories"
        rightSlot={<Badge label={role} tone={getRoleTone(role)} />}>
        <SurfaceCard>
          <Text style={styles.restrictedTitle}>Admin only</Text>
          <Text style={styles.restrictedBody}>
            Category management belongs to the admin workspace, so this tab is hidden for other roles.
          </Text>
        </SurfaceCard>
      </DashboardScreen>
    );
  }

  return (
    <DashboardScreen
      title="Categories"
      rightSlot={<Badge label={role} tone={getRoleTone(role)} />}>
      <View>
        <SectionHeader title="Category Directory" />
        <View style={styles.grid}>
          {categories.map((item) => (
            <Pressable
              key={item.code}
              accessibilityRole="button"
              onPress={() => router.push('/category-detail')}>
              <SurfaceCard>
                <View style={styles.cardTop}>
                  <Text style={styles.code}>{item.code}</Text>
                  <Badge label={item.active ? 'ACTIVE' : 'INACTIVE'} tone={item.active ? 'green' : 'slate'} />
                </View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.openDetail}>Open detail</Text>
              </SurfaceCard>
            </Pressable>
          ))}
        </View>
      </View>
    </DashboardScreen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
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
  },
  name: {
    marginTop: 12,
    fontSize: 17,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  openDetail: {
    marginTop: 12,
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
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
