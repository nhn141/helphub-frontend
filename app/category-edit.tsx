import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { categoryDetail } from '@/components/management/category-mocks';
import {
  ManagementBadge,
  ManagementButton,
  ManagementField,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';

export default function CategoryEditScreen() {
  const router = useRouter();
  const [name, setName] = useState(categoryDetail.name);
  const [code, setCode] = useState(categoryDetail.code);
  const [description, setDescription] = useState(categoryDetail.description);
  const [iconUrl, setIconUrl] = useState(categoryDetail.iconUrl);

  return (
    <ManagementScreen
      title="Edit Category"
      onBackPress={() => router.push('/category-detail')}
      rightSlot={
        <ManagementBadge label={categoryDetail.isActive ? 'ACTIVE' : 'INACTIVE'} tone={categoryDetail.isActive ? 'green' : 'slate'} />
      }>
      <ManagementSection title="Category Info">
        <ManagementField label="Name" onChangeText={setName} value={name} />
        <ManagementField label="Code" onChangeText={setCode} value={code} />
        <ManagementField
          label="Description"
          multiline
          numberOfLines={5}
          onChangeText={setDescription}
          value={description}
        />
        <ManagementField label="Icon URL" onChangeText={setIconUrl} value={iconUrl} />
      </ManagementSection>

      <View style={styles.buttonStack}>
        <ManagementButton label="Save Changes" onPress={() => router.push('/category-detail')} />
        <ManagementButton label="Cancel" onPress={() => router.push('/category-detail')} variant="outline" />
      </View>
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  buttonStack: {
    gap: 12,
  },
});
