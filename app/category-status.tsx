import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { categoryDetail } from '@/components/management/category-mocks';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementChoiceGroup,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

const statusOptions = [
  { label: 'Active', value: 'ACTIVE', detail: 'Visible for requests and posts' },
  { label: 'Inactive', value: 'INACTIVE', detail: 'Hidden from active category selection' },
];

export default function CategoryStatusScreen() {
  const router = useRouter();
  const [status, setStatus] = useState(categoryDetail.isActive ? 'ACTIVE' : 'INACTIVE');

  return (
    <ManagementScreen
      title="Update Status"
      onBackPress={() => router.push('/category-detail')}
      rightSlot={<ManagementBadge label={status} tone={status === 'ACTIVE' ? 'green' : 'slate'} />}>
      <ManagementSection title="Category Summary">
        <ManagementCard>
          <Text style={styles.title}>{categoryDetail.name}</Text>
          <View style={styles.metaStack}>
            <ManagementMetaRow icon="tag" label="Code" value={categoryDetail.code} />
            <ManagementMetaRow icon="refresh-cw" label="Current Status" value={status} />
          </View>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection title="Choose Status">
        <ManagementChoiceGroup label="Status" options={statusOptions} value={status} onChange={setStatus} />
      </ManagementSection>

      <View style={styles.buttonStack}>
        <ManagementButton label="Update Status" onPress={() => router.push('/category-detail')} />
        <ManagementButton label="Back to Detail" onPress={() => router.push('/category-detail')} variant="outline" />
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
});
