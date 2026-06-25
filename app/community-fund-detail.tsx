import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import { ShareItemSheet } from '@/components/chat/share-item-sheet';
import { FilterChip } from '@/components/dashboard/tab-ui';
import {
  addCommunityFundMember,
  createDonation,
  createExpense,
  formatCurrency,
  formatFinanceDate,
  getCommunityFund,
  getCommunityFundMembers,
  getDonationsByFund,
  getExpensesByFund,
  removeCommunityFundMember,
  updateCommunityFund,
  updateCommunityFundMemberRole,
  type CommunityFundDetail,
  type CommunityFundMember,
  type CommunityFundMemberRole,
  type Donation,
  type Expense,
  type PaymentMethod,
} from '@/components/finance/finance-api';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementChoiceGroup,
  ManagementField,
  ManagementMetaRow,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import { Fonts } from '@/constants/theme';

type FundSection = 'overview' | 'donations' | 'expenses' | 'members';

const paymentMethods: { label: string; value: PaymentMethod; detail: string }[] = [
  { label: 'Cash', value: 'CASH', detail: 'Record a cash contribution.' },
  { label: 'Bank transfer', value: 'BANK_TRANSFER', detail: 'Record a completed bank transfer.' },
  { label: 'MoMo', value: 'MOMO', detail: 'Record a completed MoMo payment.' },
  { label: 'ZaloPay', value: 'ZALOPAY', detail: 'Record a completed ZaloPay payment.' },
  { label: 'VNPay', value: 'VNPAY', detail: 'Record a completed VNPay payment.' },
  { label: 'Other', value: 'OTHER', detail: 'Record another completed payment method.' },
];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function CommunityFundDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const fundId = firstParam(params.id);
  const { session, user } = useAuth();
  const [section, setSection] = useState<FundSection>('overview');
  const [fund, setFund] = useState<CommunityFundDetail | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<CommunityFundMember[]>([]);
  const [membersAvailable, setMembersAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isActioning, setIsActioning] = useState(false);
  const [isShareSheetVisible, setIsShareSheetVisible] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editActive, setEditActive] = useState(true);

  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [transactionCode, setTransactionCode] = useState('');
  const [donationNote, setDonationNote] = useState('');

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [memberUserEmail, setMemberUserEmail] = useState('');
  const [memberRole, setMemberRole] = useState<CommunityFundMemberRole>('MEMBER');

  const currentMembership = useMemo(
    () => members.find((member) => member.userId === user?.id),
    [members, user?.id]
  );
  const canManage = user?.role === 'ADMIN' || currentMembership?.role === 'MANAGER';
  const totalDonations = useMemo(
    () => donations.filter((item) => item.status === 'SUCCESS').reduce((sum, item) => sum + Number(item.amount), 0),
    [donations]
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount), 0),
    [expenses]
  );

  const loadFund = useCallback(async () => {
    if (!session?.accessToken || !fundId) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [fundResult, donationsResult, expensesResult, membersResult] = await Promise.allSettled([
        getCommunityFund(session.accessToken, fundId),
        getDonationsByFund(session.accessToken, fundId),
        getExpensesByFund(session.accessToken, fundId),
        getCommunityFundMembers(session.accessToken, fundId),
      ]);

      if (fundResult.status === 'rejected') {
        throw fundResult.reason;
      }

      setFund(fundResult.value);
      setEditName(fundResult.value.name);
      setEditDescription(fundResult.value.description ?? '');
      setEditActive(fundResult.value.isActive);
      setDonations(donationsResult.status === 'fulfilled' ? donationsResult.value : []);
      setExpenses(expensesResult.status === 'fulfilled' ? expensesResult.value : []);
      setMembers(membersResult.status === 'fulfilled' ? membersResult.value : []);
      setMembersAvailable(membersResult.status === 'fulfilled');
    } catch (loadError) {
      setError(getAuthErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [fundId, session?.accessToken]);

  useFocusEffect(useCallback(() => void loadFund(), [loadFund]));

  async function runAction(action: () => Promise<unknown>, after?: () => void) {
    if (isActioning) {
      return;
    }
    setIsActioning(true);
    setActionError('');
    try {
      await action();
      after?.();
      await loadFund();
    } catch (actionFailure) {
      setActionError(getAuthErrorMessage(actionFailure));
    } finally {
      setIsActioning(false);
    }
  }

  function saveFund() {
    if (!session?.accessToken || !fundId || !editName.trim()) {
      setActionError('Fund name is required.');
      return;
    }
    void runAction(
      () => updateCommunityFund(session.accessToken, fundId, {
        description: editDescription.trim(),
        isActive: editActive,
        name: editName.trim(),
      }),
      () => setShowEdit(false)
    );
  }

  function submitDonation() {
    const amount = Number(donationAmount);
    if (!session?.accessToken || !fundId || !Number.isFinite(amount) || amount < 1000) {
      setActionError('Donation amount must be at least 1,000 VND.');
      return;
    }
    void runAction(
      () => createDonation(session.accessToken, {
        amount,
        fundId,
        note: donationNote.trim() || undefined,
        paymentMethod,
        transactionCode: transactionCode.trim() || undefined,
      }),
      () => {
        setDonationAmount('');
        setDonationNote('');
        setTransactionCode('');
        setShowDonationForm(false);
      }
    );
  }

  function submitExpense() {
    const amount = Number(expenseAmount);
    if (!session?.accessToken || !fundId || !Number.isFinite(amount) || amount < 1000) {
      setActionError('Expense amount must be at least 1,000 VND.');
      return;
    }
    if (!expenseDescription.trim()) {
      setActionError('Expense description is required.');
      return;
    }
    void runAction(
      () => createExpense(session.accessToken, {
        amount,
        description: expenseDescription.trim(),
        fundId,
      }),
      () => {
        setExpenseAmount('');
        setExpenseDescription('');
        setShowExpenseForm(false);
      }
    );
  }

  function submitMember() {
    const normalizedEmail = memberUserEmail.trim().toLowerCase();

    if (!session?.accessToken || !fundId || !normalizedEmail) {
      setActionError('User email is required.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setActionError('Please enter a valid user email.');
      return;
    }

    void runAction(
      () => addCommunityFundMember(session.accessToken, fundId, normalizedEmail, memberRole),
      () => {
        setMemberUserEmail('');
        setMemberRole('MEMBER');
        setShowMemberForm(false);
      }
    );
  }

  function changeMemberRole(member: CommunityFundMember) {
    if (!session?.accessToken || !fundId) {
      return;
    }
    const nextRole: CommunityFundMemberRole = member.role === 'MANAGER' ? 'MEMBER' : 'MANAGER';
    void runAction(() =>
      updateCommunityFundMemberRole(session.accessToken, fundId, member.userId, nextRole)
    );
  }

  function confirmRemoveMember(member: CommunityFundMember) {
    if (!session?.accessToken || !fundId) {
      return;
    }
    Alert.alert('Remove member', `Remove ${member.userName} from this fund?`, [
      { style: 'cancel', text: 'Cancel' },
      {
        style: 'destructive',
        text: 'Remove',
        onPress: () => void runAction(() =>
          removeCommunityFundMember(session.accessToken, fundId, member.userId)
        ),
      },
    ]);
  }

  if (!fundId) {
    return (
      <ManagementScreen title="Community Fund" onBackPress={() => router.back()}>
        <ManagementCard><Text style={styles.errorText}>Fund ID is missing.</Text></ManagementCard>
      </ManagementScreen>
    );
  }

  return (
    <ManagementScreen
      title={fund?.name ?? 'Community Fund'}
      onBackPress={() => router.back()}
      rightSlot={fund ? <ManagementBadge label={fund.isActive ? 'ACTIVE' : 'INACTIVE'} tone={fund.isActive ? 'green' : 'slate'} /> : undefined}>
      {error ? (
        <ManagementCard>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.topGap}><ManagementButton label="Try again" onPress={loadFund} variant="outline" /></View>
        </ManagementCard>
      ) : isLoading && !fund ? (
        <ManagementCard><Text style={styles.helperText}>Loading community fund...</Text></ManagementCard>
      ) : fund ? (
        <>
          <View style={styles.tabRow}>
            {(['overview', 'donations', 'expenses', 'members'] as FundSection[]).map((item) => (
              <FilterChip
                active={section === item}
                key={item}
                label={item[0].toUpperCase() + item.slice(1)}
                onPress={() => setSection(item)}
              />
            ))}
          </View>

          {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

          {section === 'overview' ? (
            <>
              <ManagementSection title="Overview">
                <ManagementCard>
                  <Text style={styles.fundDescription}>{fund.description || 'No description provided.'}</Text>
                  <View style={styles.balancePanel}>
                    <Text style={styles.balanceLabel}>Available balance</Text>
                    <Text style={styles.balanceValue}>{formatCurrency(fund.totalBalance)}</Text>
                  </View>
                  <View style={styles.metaStack}>
                    <ManagementMetaRow icon="user" label="Created by" value={fund.createdByName} />
                    <ManagementMetaRow icon="calendar" label="Created" value={formatFinanceDate(fund.createdAt)} />
                    <ManagementMetaRow icon="trending-up" label="Recorded donations" value={formatCurrency(totalDonations)} />
                    <ManagementMetaRow icon="trending-down" label="Recorded expenses" value={formatCurrency(totalExpenses)} />
                  </View>
                </ManagementCard>
              </ManagementSection>

              <ManagementSection title="Actions">
                <ManagementCard>
                  <ManagementButton
                    label={showDonationForm ? 'Close donation form' : 'Record a donation'}
                    onPress={() => setShowDonationForm((value) => !value)}
                  />
                  <View style={styles.topGap}>
                    <ManagementButton
                      label="Share to chat"
                      leftIcon={<Feather name="share-2" size={15} color={authPalette.primaryDark} />}
                      onPress={() => setIsShareSheetVisible(true)}
                      variant="outline"
                    />
                  </View>
                  {canManage ? (
                    <View style={styles.topGap}>
                      <ManagementButton
                        label={showEdit ? 'Close edit form' : 'Edit fund'}
                        onPress={() => setShowEdit((value) => !value)}
                        variant="outline"
                      />
                    </View>
                  ) : null}
                </ManagementCard>
              </ManagementSection>

              {showDonationForm ? renderDonationForm() : null}
              {showEdit && canManage ? (
                <ManagementSection title="Edit fund">
                  <ManagementCard>
                    <ManagementField label="Name" maxLength={200} onChangeText={setEditName} value={editName} />
                    <ManagementField label="Description" multiline onChangeText={setEditDescription} value={editDescription} />
                    <ManagementChoiceGroup
                      label="Status"
                      onChange={(value) => setEditActive(value === 'active')}
                      options={[
                        { detail: 'The fund remains visible and accepts donations.', label: 'Active', value: 'active' },
                        { detail: 'Keep the history but stop active use.', label: 'Inactive', value: 'inactive' },
                      ]}
                      value={editActive ? 'active' : 'inactive'}
                    />
                    <View style={styles.formButtonGap}>
                      <ManagementButton
                        disabled={isActioning}
                        label={isActioning ? 'Saving...' : 'Save changes'}
                        onPress={saveFund}
                      />
                    </View>
                  </ManagementCard>
                </ManagementSection>
              ) : null}
            </>
          ) : null}

          {section === 'donations' ? (
            <ManagementSection
              title="Donations"
              action={<Pressable onPress={() => setShowDonationForm((value) => !value)}><Feather name="plus-circle" size={22} color={authPalette.primaryDark} /></Pressable>}>
              {showDonationForm ? renderDonationForm() : null}
              {donations.length === 0 ? (
                <ManagementCard><Text style={styles.helperText}>No donations recorded for this fund.</Text></ManagementCard>
              ) : (
                <View style={styles.stack}>
                  {donations.map((donation) => (
                    <ManagementCard key={donation.id}>
                      <View style={styles.itemTop}>
                        <ManagementBadge label={donation.status} tone={donation.status === 'SUCCESS' ? 'green' : 'red'} />
                        <Text style={styles.itemAmount}>{formatCurrency(donation.amount)}</Text>
                      </View>
                      <Text style={styles.itemTitle}>{donation.donorName}</Text>
                      <Text style={styles.helperText}>{donation.paymentMethod.replaceAll('_', ' ')}</Text>
                      {donation.note ? <Text style={styles.note}>{donation.note}</Text> : null}
                      <Text style={styles.dateText}>{formatFinanceDate(donation.createdAt)}</Text>
                    </ManagementCard>
                  ))}
                </View>
              )}
            </ManagementSection>
          ) : null}

          {section === 'expenses' ? (
            <ManagementSection
              title="Expenses"
              action={canManage ? <Pressable onPress={() => setShowExpenseForm((value) => !value)}><Feather name="plus-circle" size={22} color={authPalette.primaryDark} /></Pressable> : undefined}>
              {showExpenseForm && canManage ? (
                <ManagementCard>
                  <ManagementField label="Amount (VND)" keyboardType="numeric" onChangeText={setExpenseAmount} value={expenseAmount} />
                  <ManagementField label="Description" multiline maxLength={1000} onChangeText={setExpenseDescription} value={expenseDescription} />
                  <View style={styles.formButtonGap}>
                    <ManagementButton
                      disabled={isActioning}
                      label={isActioning ? 'Saving...' : 'Record expense'}
                      onPress={submitExpense}
                    />
                  </View>
                </ManagementCard>
              ) : null}
              {expenses.length === 0 ? (
                <ManagementCard><Text style={styles.helperText}>No expenses recorded for this fund.</Text></ManagementCard>
              ) : (
                <View style={styles.stack}>
                  {expenses.map((expense) => (
                    <ManagementCard key={expense.id}>
                      <View style={styles.itemTop}>
                        <ManagementBadge label="EXPENSE" tone="amber" />
                        <Text style={styles.expenseAmount}>-{formatCurrency(expense.amount)}</Text>
                      </View>
                      <Text style={styles.itemTitle}>{expense.description}</Text>
                      <Text style={styles.helperText}>Recorded by {expense.createdByName}</Text>
                      {expense.supportRequestTitle ? <Text style={styles.note}>For: {expense.supportRequestTitle}</Text> : null}
                      <Text style={styles.dateText}>{formatFinanceDate(expense.createdAt)}</Text>
                    </ManagementCard>
                  ))}
                </View>
              )}
            </ManagementSection>
          ) : null}

          {section === 'members' ? (
            <ManagementSection
              title="Fund members"
              action={canManage ? <Pressable onPress={() => setShowMemberForm((value) => !value)}><Feather name="user-plus" size={22} color={authPalette.primaryDark} /></Pressable> : undefined}>
              {!membersAvailable ? (
                <ManagementCard><Text style={styles.helperText}>Only an admin or active fund member can view this member list.</Text></ManagementCard>
              ) : null}
              {showMemberForm && canManage ? (
                <ManagementCard>
                  <ManagementField
                    label="User email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setMemberUserEmail}
                    placeholder="member@example.com"
                    textContentType="emailAddress"
                    value={memberUserEmail}
                  />
                  <ManagementChoiceGroup
                    label="Fund role"
                    onChange={(value) => setMemberRole(value as CommunityFundMemberRole)}
                    options={[
                      { detail: 'Can view fund members and activity.', label: 'Member', value: 'MEMBER' },
                      { detail: 'Can manage the fund, members and expenses.', label: 'Manager', value: 'MANAGER' },
                    ]}
                    value={memberRole}
                  />
                  <View style={styles.formButtonGap}>
                    <ManagementButton
                      disabled={isActioning}
                      label={isActioning ? 'Adding...' : 'Add member'}
                      onPress={submitMember}
                    />
                  </View>
                </ManagementCard>
              ) : null}
              <View style={styles.stack}>
                {members.map((member) => (
                  <ManagementCard key={member.userId}>
                    <View style={styles.itemTop}>
                      <View style={styles.memberCopy}>
                        <Text style={styles.itemTitle}>{member.userName}</Text>
                        <Text style={styles.helperText}>{member.userEmail}</Text>
                      </View>
                      <ManagementBadge label={member.role} tone={member.role === 'MANAGER' ? 'mint' : 'slate'} />
                    </View>
                    <Text style={styles.dateText}>Joined {formatFinanceDate(member.joinedAt)}</Text>
                    {canManage && member.userId !== user?.id ? (
                      <View style={styles.memberActions}>
                        <Pressable onPress={() => changeMemberRole(member)} style={styles.smallButton}>
                          <Text style={styles.smallButtonText}>{member.role === 'MANAGER' ? 'Make member' : 'Make manager'}</Text>
                        </Pressable>
                        <Pressable onPress={() => confirmRemoveMember(member)} style={styles.smallDangerButton}>
                          <Text style={styles.smallDangerText}>Remove</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </ManagementCard>
                ))}
              </View>
            </ManagementSection>
          ) : null}
        </>
      ) : null}

      {fund ? (
        <ShareItemSheet
          itemId={fund.id}
          itemTitle={fund.name}
          itemType="FUND"
          onClose={() => setIsShareSheetVisible(false)}
          visible={isShareSheetVisible}
        />
      ) : null}
    </ManagementScreen>
  );

  function renderDonationForm() {
    return (
      <ManagementSection title="Record donation">
        <ManagementCard>
          <Text style={styles.formNotice}>
            This records a payment that has already been completed. It does not open an external checkout.
          </Text>
          <ManagementField label="Amount (VND)" keyboardType="numeric" onChangeText={setDonationAmount} value={donationAmount} />
          <ManagementChoiceGroup
            label="Payment method"
            onChange={(value) => setPaymentMethod(value as PaymentMethod)}
            options={paymentMethods}
            value={paymentMethod}
          />
          <ManagementField label="Transaction code (optional)" maxLength={100} onChangeText={setTransactionCode} value={transactionCode} />
          <ManagementField label="Note (optional)" maxLength={500} multiline onChangeText={setDonationNote} value={donationNote} />
          <View style={styles.formButtonGap}>
            <ManagementButton
              disabled={isActioning}
              label={isActioning ? 'Recording...' : 'Record donation'}
              onPress={submitDonation}
            />
          </View>
        </ManagementCard>
      </ManagementSection>
    );
  }
}

const styles = StyleSheet.create({
  balanceLabel: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 13 },
  balancePanel: { backgroundColor: '#E5F6ED', borderRadius: 20, marginTop: 18, padding: 17 },
  balanceValue: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 26, marginTop: 7 },
  dateText: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 11, marginTop: 12 },
  errorText: { color: '#AE3F3A', fontFamily: Fonts.rounded, fontSize: 14, lineHeight: 21 },
  expenseAmount: { color: '#AE3F3A', fontFamily: Fonts.rounded, fontSize: 17 },
  formNotice: { backgroundColor: '#FFF5E2', borderRadius: 14, color: '#805B12', fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20, marginBottom: 4, padding: 12 },
  formButtonGap: { marginTop: 16 },
  fundDescription: { color: authPalette.text, fontFamily: Fonts.rounded, fontSize: 15, lineHeight: 23 },
  helperText: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 20, marginTop: 4 },
  itemAmount: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 17 },
  itemTitle: { color: authPalette.text, fontFamily: Fonts.rounded, fontSize: 16, lineHeight: 22, marginTop: 12 },
  itemTop: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  memberActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  memberCopy: { flex: 1 },
  metaStack: { gap: 14, marginTop: 18 },
  note: { backgroundColor: '#F1F7F2', borderRadius: 14, color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 19, marginTop: 12, padding: 12 },
  smallButton: { backgroundColor: '#E5F6ED', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
  smallButtonText: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 12 },
  smallDangerButton: { backgroundColor: '#FDE7E6', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
  smallDangerText: { color: '#AE3F3A', fontFamily: Fonts.rounded, fontSize: 12 },
  stack: { gap: 12 },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topGap: { marginTop: 12 },
});
