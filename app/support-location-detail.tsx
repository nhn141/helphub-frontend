import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { supportLocationDetail } from '@/components/management/support-location-mocks';
import {
  ManagementBadge,
  ManagementCard,
  ManagementInlineLink,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

export default function SupportLocationDetailScreen() {
  const router = useRouter();

  return (
    <ManagementScreen
      title="Support Location"
      onBackPress={() => router.push('/(tabs)/support-locations')}
      rightSlot={
        <ManagementBadge
          label={supportLocationDetail.isActive ? 'ACTIVE' : 'INACTIVE'}
          tone={supportLocationDetail.isActive ? 'green' : 'slate'}
        />
      }>
      <ManagementSection
        title="Overview"
        action={<ManagementInlineLink label="Edit" onPress={() => router.push('/support-location-edit')} />}>
        <ManagementCard>
          <Text style={styles.category}>{supportLocationDetail.categoryName}</Text>
          <Text style={styles.title}>{supportLocationDetail.name}</Text>
          <Text style={styles.description}>{supportLocationDetail.description}</Text>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection
        title="Contact"
        action={<ManagementInlineLink label="Status" onPress={() => router.push('/support-location-status')} />}>
        <ManagementCard>
          <View style={styles.metaStack}>
            <ManagementMetaRow icon="map-pin" label="Address" value={supportLocationDetail.address} />
            <ManagementMetaRow icon="phone" label="Phone" value={supportLocationDetail.contactPhone} />
          </View>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection title="Funding">
        <ManagementCard>
          <View style={styles.metaStack}>
            <ManagementMetaRow icon="credit-card" label="Bank" value={supportLocationDetail.bankName} />
            <ManagementMetaRow
              icon="hash"
              label="Account Number"
              value={supportLocationDetail.bankAccountNumber}
            />
          </View>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection
        title="Assignments"
        action={
          <ManagementInlineLink
            label="Assign Request"
            onPress={() => router.push('/support-location-assign-request')}
          />
        }>
        <ManagementCard>
          <View style={styles.metaStack}>
            <ManagementMetaRow
              icon="clipboard"
              label="Assigned Requests"
              value={`${supportLocationDetail.assignedRequests} active requests`}
            />
            <ManagementMetaRow icon="clock" label="Created At" value={supportLocationDetail.createdAt} />
            <ManagementMetaRow icon="refresh-cw" label="Updated At" value={supportLocationDetail.updatedAt} />
          </View>
        </ManagementCard>
      </ManagementSection>
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  category: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  title: {
    marginTop: 8,
    fontSize: 22,
    lineHeight: 30,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  description: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  metaStack: {
    gap: 14,
  },
});
