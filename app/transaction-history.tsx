import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import {
  formatCurrency,
  formatFinanceDate,
  getMyDonations,
  type Donation,
} from '@/components/finance/finance-api';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

export default function TransactionHistoryScreen() {
  const { session } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const total = useMemo(
    () => donations.filter((item) => item.status === 'SUCCESS').reduce((sum, item) => sum + Number(item.amount), 0),
    [donations]
  );

  const loadDonations = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      setDonations(await getMyDonations(session.accessToken));
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  useFocusEffect(useCallback(() => void loadDonations(), [loadDonations]));

  return (
    <ManagementScreen title="Transaction History" onBackPress={() => router.back()}>
      <ManagementSection title="Donation summary">
        <ManagementCard>
          <Text style={styles.summaryLabel}>Successful donations</Text>
          <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
          <Text style={styles.helperText}>{donations.length} recorded transaction(s)</Text>
        </ManagementCard>
      </ManagementSection>
      <ManagementSection title="Community fund donations">
        {error ? (
          <ManagementCard>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.retryButton}><ManagementButton label="Try again" onPress={loadDonations} variant="outline" /></View>
          </ManagementCard>
        ) : isLoading ? (
          <ManagementCard><Text style={styles.helperText}>Loading transactions...</Text></ManagementCard>
        ) : donations.length === 0 ? (
          <ManagementCard>
            <Text style={styles.emptyTitle}>No donations yet</Text>
            <Text style={styles.helperText}>Your completed community-fund donations will appear here.</Text>
          </ManagementCard>
        ) : (
          <View style={styles.stack}>
            {donations.map((donation) => (
              <ManagementCard key={donation.id}>
                <View style={styles.row}>
                  <ManagementBadge label={donation.status} tone={donation.status === 'SUCCESS' ? 'green' : 'red'} />
                  <Text style={styles.amount}>{formatCurrency(donation.amount)}</Text>
                </View>
                <Text style={styles.fundName}>{donation.fundName}</Text>
                <Text style={styles.helperText}>{donation.paymentMethod.replaceAll('_', ' ')}</Text>
                {donation.note ? <Text style={styles.note}>{donation.note}</Text> : null}
                <Text style={styles.dateText}>{formatFinanceDate(donation.createdAt)}</Text>
              </ManagementCard>
            ))}
          </View>
        )}
      </ManagementSection>
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  amount: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 17 },
  dateText: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 11, marginTop: 12 },
  emptyTitle: { color: authPalette.text, fontFamily: Fonts.rounded, fontSize: 16 },
  errorText: { color: '#AE3F3A', fontFamily: Fonts.rounded, fontSize: 14 },
  fundName: { color: authPalette.text, fontFamily: Fonts.rounded, fontSize: 16, marginTop: 14 },
  helperText: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20, marginTop: 6 },
  note: { backgroundColor: '#F1F7F2', borderRadius: 14, color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 19, marginTop: 12, padding: 12 },
  retryButton: { marginTop: 14 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  stack: { gap: 12 },
  summaryLabel: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 13 },
  summaryValue: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 27, marginTop: 8 },
});
