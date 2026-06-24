import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import { SectionTabs } from '@/components/dashboard/section-tabs';
import { FilterChip } from '@/components/dashboard/tab-ui';
import {
  formatCurrency,
  formatFinanceDate,
  getCommunityFunds,
  getMyCommunityFunds,
  getMyDonations,
  type Donation,
  type CommunityFundSummary,
} from '@/components/finance/finance-api';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

type FundView = 'all' | 'mine';
type FinanceSection = 'funds' | 'transactions';

type CommunityFundsContentProps = {
  showBackButton?: boolean;
};

export function CommunityFundsContent({ showBackButton = true }: CommunityFundsContentProps) {
  const { session, user } = useAuth();
  const [section, setSection] = useState<FinanceSection>('funds');
  const [view, setView] = useState<FundView>('all');
  const [funds, setFunds] = useState<CommunityFundSummary[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDonationsLoading, setIsDonationsLoading] = useState(false);
  const [error, setError] = useState('');
  const [donationsError, setDonationsError] = useState('');
  const canCreate = user?.role === 'ADMIN' || user?.role === 'COLLABORATOR';

  const totalBalance = useMemo(
    () => funds.reduce((total, fund) => total + Number(fund.totalBalance || 0), 0),
    [funds]
  );
  const totalDonations = useMemo(
    () => donations.filter((item) => item.status === 'SUCCESS').reduce((sum, item) => sum + Number(item.amount), 0),
    [donations]
  );

  const loadFunds = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data =
        view === 'mine'
          ? await getMyCommunityFunds(session.accessToken)
          : await getCommunityFunds(session.accessToken, false);
      setFunds(data);
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, view]);

  const loadDonations = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    setIsDonationsLoading(true);
    setDonationsError('');

    try {
      setDonations(await getMyDonations(session.accessToken));
    } catch (loadError) {
      setDonationsError(getAuthErrorMessage(loadError));
    } finally {
      setIsDonationsLoading(false);
    }
  }, [session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      void loadFunds();
    }, [loadFunds])
  );

  useFocusEffect(
    useCallback(() => {
      void loadDonations();
    }, [loadDonations])
  );

  return (
    <ManagementScreen
      title="Community Funds"
      onBackPress={showBackButton ? () => router.back() : undefined}>
      <ManagementSection title="Fund workspace">
        <ManagementCard>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryLabel}>{view === 'mine' ? 'My funds' : 'Visible funds'}</Text>
              <Text style={styles.summaryValue}>{funds.length}</Text>
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryLabel}>Combined balance</Text>
              <Text style={styles.summaryValueSmall}>{formatCurrency(totalBalance)}</Text>
            </View>
          </View>
          <View style={styles.filterRow}>
            <FilterChip active={view === 'all'} label="All funds" onPress={() => setView('all')} />
            <FilterChip active={view === 'mine'} label="My funds" onPress={() => setView('mine')} />
          </View>
          {canCreate ? (
            <ManagementButton
              label="Create community fund"
              leftIcon={<Feather name="plus" size={17} color="#FFFFFF" />}
              onPress={() => router.push('/community-fund-create' as never)}
            />
          ) : null}
        </ManagementCard>
      </ManagementSection>

      <SectionTabs
        items={[
          {
            active: section === 'funds',
            icon: 'dollar-sign',
            label: 'Funds',
            onPress: () => setSection('funds'),
          },
          {
            active: section === 'transactions',
            icon: 'credit-card',
            label: 'Transactions',
            onPress: () => setSection('transactions'),
          },
        ]}
      />

      {section === 'funds' ? (
        <ManagementSection title="Funds">
          {error ? (
            <ManagementCard>
              <Text style={styles.errorText}>{error}</Text>
              <View style={styles.actionGap}>
                <ManagementButton label="Try again" onPress={loadFunds} variant="outline" />
              </View>
            </ManagementCard>
          ) : isLoading ? (
            <ManagementCard>
              <Text style={styles.helperText}>Loading community funds...</Text>
            </ManagementCard>
          ) : funds.length === 0 ? (
            <ManagementCard>
              <Text style={styles.emptyTitle}>No funds found</Text>
              <Text style={styles.helperText}>
                {view === 'mine' ? 'You are not a member of a fund yet.' : 'No community fund has been created yet.'}
              </Text>
            </ManagementCard>
          ) : (
            <View style={styles.stack}>
              {funds.map((fund) => (
                <Pressable
                  accessibilityRole="button"
                  key={fund.id}
                  onPress={() =>
                    router.push({ pathname: '/community-fund-detail', params: { id: fund.id } } as never)
                  }>
                  <ManagementCard>
                    <View style={styles.cardTop}>
                      <ManagementBadge
                        label={fund.isActive ? 'ACTIVE' : 'INACTIVE'}
                        tone={fund.isActive ? 'green' : 'slate'}
                      />
                      <Text style={styles.dateText}>{formatFinanceDate(fund.createdAt)}</Text>
                    </View>
                    <Text style={styles.fundName}>{fund.name}</Text>
                    <Text style={styles.creatorText}>Created by {fund.createdByName}</Text>
                    <View style={styles.balanceRow}>
                      <Text style={styles.balanceLabel}>Current balance</Text>
                      <Text style={styles.balanceValue}>{formatCurrency(fund.totalBalance)}</Text>
                    </View>
                    <View style={styles.openRow}>
                      <Text style={styles.openText}>Open fund</Text>
                      <Feather name="arrow-right" size={16} color={authPalette.primaryDark} />
                    </View>
                  </ManagementCard>
                </Pressable>
              ))}
            </View>
          )}
        </ManagementSection>
      ) : (
        <>
          <ManagementSection title="Donation summary">
            <ManagementCard>
              <Text style={styles.summaryLabel}>Successful donations</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalDonations)}</Text>
              <Text style={styles.helperText}>{donations.length} recorded transaction(s)</Text>
            </ManagementCard>
          </ManagementSection>

          <ManagementSection title="Community fund donations">
            {donationsError ? (
              <ManagementCard>
                <Text style={styles.errorText}>{donationsError}</Text>
                <View style={styles.actionGap}>
                  <ManagementButton label="Try again" onPress={loadDonations} variant="outline" />
                </View>
              </ManagementCard>
            ) : isDonationsLoading ? (
              <ManagementCard>
                <Text style={styles.helperText}>Loading transactions...</Text>
              </ManagementCard>
            ) : donations.length === 0 ? (
              <ManagementCard>
                <Text style={styles.emptyTitle}>No donations yet</Text>
                <Text style={styles.helperText}>Your completed community-fund donations will appear here.</Text>
              </ManagementCard>
            ) : (
              <View style={styles.stack}>
                {donations.map((donation) => (
                  <ManagementCard key={donation.id}>
                    <View style={styles.cardTop}>
                      <ManagementBadge
                        label={donation.status}
                        tone={donation.status === 'SUCCESS' ? 'green' : 'red'}
                      />
                      <Text style={styles.amount}>{formatCurrency(donation.amount)}</Text>
                    </View>
                    <Text style={styles.transactionFundName}>{donation.fundName}</Text>
                    <Text style={styles.helperText}>{donation.paymentMethod.replaceAll('_', ' ')}</Text>
                    {donation.note ? <Text style={styles.note}>{donation.note}</Text> : null}
                    <Text style={styles.dateText}>{formatFinanceDate(donation.createdAt)}</Text>
                  </ManagementCard>
                ))}
              </View>
            )}
          </ManagementSection>
        </>
      )}
    </ManagementScreen>
  );
}

export default function CommunityFundsScreen() {
  return <CommunityFundsContent />;
}

const styles = StyleSheet.create({
  actionGap: { marginTop: 14 },
  amount: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 17 },
  balanceLabel: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 13 },
  balanceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  balanceValue: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 17 },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  creatorText: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 13, marginTop: 6 },
  dateText: { color: authPalette.muted, flexShrink: 1, fontFamily: Fonts.rounded, fontSize: 11, textAlign: 'right' },
  emptyTitle: { color: authPalette.text, fontFamily: Fonts.rounded, fontSize: 16 },
  errorText: { color: '#AE3F3A', fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 21 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, marginTop: 18 },
  fundName: { color: authPalette.text, fontFamily: Fonts.rounded, fontSize: 18, marginTop: 14 },
  helperText: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 21, marginTop: 6 },
  note: { backgroundColor: '#F1F7F2', borderRadius: 14, color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 19, marginTop: 12, padding: 12 },
  openRow: { alignItems: 'center', flexDirection: 'row', gap: 7, justifyContent: 'flex-end', marginTop: 18 },
  openText: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 13 },
  stack: { gap: 12 },
  summaryCopy: { flex: 1, gap: 5 },
  summaryLabel: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 12 },
  summaryRow: { flexDirection: 'row', gap: 18 },
  summaryValue: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 26 },
  summaryValueSmall: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 17 },
  transactionFundName: { color: authPalette.text, fontFamily: Fonts.rounded, fontSize: 16, marginTop: 14 },
});
