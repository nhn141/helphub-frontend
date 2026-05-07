import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { supportLocationCategories } from '@/components/management/support-location-mocks';
import {
  ManagementButton,
  ManagementChoiceGroup,
  ManagementField,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';

export default function SupportLocationCreateScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(supportLocationCategories[0].value);
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  return (
    <ManagementScreen
      title="Create Location"
      onBackPress={() => router.push('/(tabs)/support-locations')}>
      <ManagementSection title="Location Info">
        <ManagementField label="Name" onChangeText={setName} value={name} />
        <ManagementField
          label="Description"
          multiline
          numberOfLines={5}
          onChangeText={setDescription}
          value={description}
        />
        <ManagementChoiceGroup
          label="Category"
          options={supportLocationCategories}
          value={category}
          onChange={setCategory}
        />
        <ManagementField label="Address" onChangeText={setAddress} value={address} />
        <ManagementField label="Contact Phone" onChangeText={setContactPhone} value={contactPhone} />
        <ManagementField label="Bank Name" onChangeText={setBankName} value={bankName} />
        <ManagementField
          label="Bank Account Number"
          onChangeText={setBankAccountNumber}
          value={bankAccountNumber}
        />
      </ManagementSection>

      <View style={styles.buttonStack}>
        <ManagementButton label="Create Location" onPress={() => router.push('/support-location-detail')} />
        <ManagementButton
          label="Back to Locations"
          onPress={() => router.push('/(tabs)/support-locations')}
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
