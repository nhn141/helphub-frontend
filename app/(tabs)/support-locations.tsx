import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { Badge, DashboardScreen, SectionHeader, SurfaceCard } from '@/components/dashboard/tab-ui';
import { useDemoRole } from '@/components/demo-role/demo-role-provider';
import { supportLocationSummaries } from '@/components/management/support-location-mocks';
import { canManageSupportLocations, getRoleTone } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';

export default function SupportLocationsTabScreen() {
  const router = useRouter();
  const { role } = useDemoRole();
  const isCollaborator = canManageSupportLocations(role);

  if (!isCollaborator) {
    return (
      <DashboardScreen
        title="Support Locations"
        rightSlot={<Badge label={role} tone={getRoleTone(role)} />}>
        <SurfaceCard>
          <Text style={styles.restrictedTitle}>Collaborator only</Text>
          <Text style={styles.restrictedBody}>
            Support location management belongs to the collaborator workspace in this demo.
          </Text>
        </SurfaceCard>
      </DashboardScreen>
    );
  }

  return (
    <DashboardScreen
      title="Support Locations"
      rightSlot={<Badge label={role} tone={getRoleTone(role)} />}>
      <View>
        <SectionHeader
          title="Location Directory"
          action={
            <Pressable accessibilityRole="button" onPress={() => router.push('/support-location-create')}>
              <Text style={styles.headerAction}>New Location</Text>
            </Pressable>
          }
        />
        <View style={styles.stack}>
          {supportLocationSummaries.map((item) => (
            <Pressable
              key={item.name}
              accessibilityRole="button"
              onPress={() => router.push('/support-location-detail')}>
              <SurfaceCard>
                <View style={styles.cardTop}>
                  <Badge
                    label={item.isActive ? 'ACTIVE' : 'INACTIVE'}
                    tone={item.isActive ? 'green' : 'slate'}
                  />
                  <Text style={styles.cardMeta}>{item.categoryName}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardBody}>{item.address}</Text>
                <Text style={styles.cardBody}>{item.contactPhone}</Text>
                <Text style={styles.cardLink}>Open detail</Text>
              </SurfaceCard>
            </Pressable>
          ))}
        </View>
      </View>
    </DashboardScreen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  headerAction: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardMeta: {
    fontSize: 12,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 17,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  cardBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  cardLink: {
    marginTop: 14,
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
