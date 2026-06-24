import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { createCommunityFund } from '@/components/finance/finance-api';
import {
  ManagementButton,
  ManagementCard,
  ManagementField,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

export default function CommunityFundCreateScreen() {
  const { session, user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const canCreate = user?.role === 'ADMIN' || user?.role === 'COLLABORATOR';

  async function handleCreate() {
    if (!session?.accessToken || isSaving) {
      return;
    }

    if (!name.trim()) {
      setError('Fund name is required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const fund = await createCommunityFund(session.accessToken, {
        description: description.trim(),
        name: name.trim(),
      });
      router.replace({ pathname: '/community-fund-detail', params: { id: fund.id } } as never);
    } catch (saveError) {
      setError(getAuthErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ManagementScreen title="Create Fund" onBackPress={() => router.back()}>
      <ManagementSection title="Fund information">
        <ManagementCard>
          {!canCreate ? (
            <Text style={styles.errorText}>Only admins and collaborators can create a community fund.</Text>
          ) : (
            <>
              <ManagementField
                label="Fund name"
                maxLength={200}
                onChangeText={setName}
                placeholder="Community emergency fund"
                value={name}
              />
              <ManagementField
                label="Description"
                multiline
                onChangeText={setDescription}
                placeholder="Explain the purpose and how this fund will be used"
                value={description}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <ManagementButton
                disabled={isSaving}
                label={isSaving ? 'Creating...' : 'Create fund'}
                onPress={handleCreate}
              />
            </>
          )}
        </ManagementCard>
      </ManagementSection>
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  errorText: { color: '#AE3F3A', fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 21, marginBottom: 12 },
});
