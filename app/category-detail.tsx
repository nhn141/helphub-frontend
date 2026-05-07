import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { categoryDetail } from '@/components/management/category-mocks';
import {
  ManagementBadge,
  ManagementCard,
  ManagementInlineLink,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

export default function CategoryDetailScreen() {
  const router = useRouter();

  return (
    <ManagementScreen
      title="Category Detail"
      onBackPress={() => router.push('/(tabs)/categories')}
      rightSlot={
        <ManagementBadge label={categoryDetail.isActive ? 'ACTIVE' : 'INACTIVE'} tone={categoryDetail.isActive ? 'green' : 'slate'} />
      }>
      <ManagementSection title="Overview">
        <ManagementCard>
          <Text style={styles.code}>{categoryDetail.code}</Text>
          <Text style={styles.title}>{categoryDetail.name}</Text>
          <Text style={styles.description}>{categoryDetail.description}</Text>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection
        title="Details"
        action={<ManagementInlineLink label="Edit" onPress={() => router.push('/category-edit')} />}>
        <ManagementCard>
          <View style={styles.metaStack}>
            <ManagementMetaRow icon="tag" label="Code" value={categoryDetail.code} />
            <ManagementMetaRow icon="image" label="Icon" value="Icon linked for category card" />
            <ManagementMetaRow icon="clock" label="Created At" value={categoryDetail.createdAt} />
            <ManagementMetaRow icon="refresh-cw" label="Updated At" value={categoryDetail.updatedAt} />
          </View>
        </ManagementCard>
      </ManagementSection>
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  code: {
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
