import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ManagementButton,
  ManagementField,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';

export default function CategoryCreateScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');

  return (
    <ManagementScreen title="Create Category" onBackPress={() => router.push('/(tabs)/categories')}>
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
        <ManagementButton label="Create Category" onPress={() => router.push('/category-detail')} />
        <ManagementButton
          label="Back to Categories"
          onPress={() => router.push('/(tabs)/categories')}
          variant="outline"
        />
      </View>
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  buttonStack: {
    gap: 12,
  },
});
