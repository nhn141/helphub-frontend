import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { supportLocationCategories, supportLocationDetail } from '@/components/management/support-location-mocks';
import {
  ManagementBadge,
  ManagementButton,
  ManagementChoiceGroup,
  ManagementField,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';

export default function SupportLocationEditScreen() {
  const router = useRouter();
  const [name, setName] = useState(supportLocationDetail.name);
  const [description, setDescription] = useState(supportLocationDetail.description);
  const [category, setCategory] = useState('FOOD');
  const [address, setAddress] = useState(supportLocationDetail.address);
  const [contactPhone, setContactPhone] = useState(supportLocationDetail.contactPhone);
  const [bankName, setBankName] = useState(supportLocationDetail.bankName);
  const [bankAccountNumber, setBankAccountNumber] = useState(supportLocationDetail.bankAccountNumber);

  return (
    <ManagementScreen
      title="Edit Location"
      onBackPress={() => router.push('/support-location-detail')}
      rightSlot={
        <ManagementBadge
          label={supportLocationDetail.isActive ? 'ACTIVE' : 'INACTIVE'}
          tone={supportLocationDetail.isActive ? 'green' : 'slate'}
        />
      }>
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
        <ManagementButton label="Save Changes" onPress={() => router.push('/support-location-detail')} />
        <ManagementButton
          label="Cancel"
          onPress={() => router.push('/support-location-detail')}
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
