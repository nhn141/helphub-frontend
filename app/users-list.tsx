import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { userSummaries } from '@/components/management/user-mocks';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

const filters = ['All Users', 'Requester', 'Volunteer', 'Collaborator'];

export default function UsersListScreen() {
  const router = useRouter();

  return (
    <ManagementScreen title="User Directory" onBackPress={() => router.push('/(tabs)/profile')}>
      <ManagementSection title="Filters">
        <View style={styles.filterRow}>
          {filters.map((item, index) => (
            <View key={item} style={[styles.filterChip, index === 0 && styles.filterChipActive]}>
              <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>{item}</Text>
            </View>
          ))}
        </View>
      </ManagementSection>

      <ManagementSection title="Users">
        <View style={styles.stack}>
          {userSummaries.map((item) => (
            <Pressable
              key={item.email}
              accessibilityRole="button"
              onPress={() => router.push('/user-detail')}>
              <ManagementCard>
                <View style={styles.cardTop}>
                  <Text style={styles.name}>{item.fullName}</Text>
                  <ManagementBadge label={item.role} tone={item.role === 'COLLABORATOR' ? 'amber' : 'green'} />
                </View>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.phone}>{item.phone}</Text>
                <View style={styles.cardBottom}>
                  <ManagementBadge label={item.isActive ? 'ACTIVE' : 'INACTIVE'} tone={item.isActive ? 'green' : 'slate'} />
                  <Text style={styles.openDetail}>Open detail</Text>
                </View>
              </ManagementCard>
            </Pressable>
          ))}
        </View>
      </ManagementSection>

      <ManagementButton label="Back to Profile" onPress={() => router.push('/(tabs)/profile')} variant="outline" />
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    borderRadius: 999,
    backgroundColor: '#ECF2EC',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: authPalette.primaryDark,
  },
  filterText: {
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  stack: {
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  name: {
    flex: 1,
    fontSize: 18,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  email: {
    marginTop: 10,
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  phone: {
    marginTop: 6,
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  cardBottom: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  openDetail: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
});
