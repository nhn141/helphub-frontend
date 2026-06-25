import { apiRequest, type ApiEnvelope } from '@/components/auth/auth-api';

export type CommunityFundMemberRole = 'MEMBER' | 'MANAGER';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MOMO' | 'ZALOPAY' | 'VNPAY' | 'OTHER';
export type DonationStatus = 'SUCCESS' | 'CANCELLED';

export type CommunityFundSummary = {
  id: string;
  name: string;
  totalBalance: number;
  isActive: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
};

export type CommunityFundDetail = CommunityFundSummary & {
  description: string;
  updatedAt: string | null;
};

export type CommunityFundMember = {
  fundId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: CommunityFundMemberRole;
  isActive: boolean;
  joinedAt: string;
};

export type Donation = {
  id: string;
  fundId: string;
  fundName: string;
  donorId: string;
  donorName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: DonationStatus;
  transactionCode: string | null;
  note: string | null;
  createdAt: string;
};

export type Expense = {
  id: string;
  fundId: string;
  fundName: string;
  supportRequestId: string | null;
  supportRequestTitle: string | null;
  createdBy: string;
  createdByName: string;
  amount: number;
  description: string;
  createdAt: string;
};

export type CommunityFundPayload = {
  name: string;
  description?: string;
  isActive?: boolean;
};

export type DonationPayload = {
  fundId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionCode?: string;
  note?: string;
};

export type ExpensePayload = {
  fundId: string;
  supportRequestId?: string;
  amount: number;
  description: string;
};

export async function getCommunityFunds(accessToken: string, activeOnly = true) {
  const response = await apiRequest<ApiEnvelope<CommunityFundSummary[]>>(
    `/community-funds?activeOnly=${activeOnly}`,
    { accessToken, method: 'GET' }
  );
  return response.data;
}

export async function getMyCommunityFunds(accessToken: string) {
  const response = await apiRequest<ApiEnvelope<CommunityFundSummary[]>>(
    '/community-funds/my-funds',
    { accessToken, method: 'GET' }
  );
  return response.data;
}

export async function getCommunityFund(accessToken: string, fundId: string) {
  const response = await apiRequest<ApiEnvelope<CommunityFundDetail>>(
    `/community-funds/${fundId}`,
    { accessToken, method: 'GET' }
  );
  return response.data;
}

export async function createCommunityFund(accessToken: string, payload: CommunityFundPayload) {
  const response = await apiRequest<ApiEnvelope<CommunityFundDetail>>('/community-funds', {
    accessToken,
    body: JSON.stringify(payload),
    method: 'POST',
  });
  return response.data;
}

export async function updateCommunityFund(
  accessToken: string,
  fundId: string,
  payload: CommunityFundPayload
) {
  const response = await apiRequest<ApiEnvelope<CommunityFundDetail>>(
    `/community-funds/${fundId}`,
    { accessToken, body: JSON.stringify(payload), method: 'PUT' }
  );
  return response.data;
}

export async function getCommunityFundMembers(accessToken: string, fundId: string) {
  const response = await apiRequest<ApiEnvelope<CommunityFundMember[]>>(
    `/community-funds/${fundId}/members`,
    { accessToken, method: 'GET' }
  );
  return response.data.filter((member) => member.isActive !== false);
}

export async function addCommunityFundMember(
  accessToken: string,
  fundId: string,
  userEmail: string,
  role: CommunityFundMemberRole
) {
  const response = await apiRequest<ApiEnvelope<CommunityFundMember>>(
    `/community-funds/${fundId}/members`,
    { accessToken, body: JSON.stringify({ role, userEmail: userEmail.trim().toLowerCase() }), method: 'POST' }
  );
  return response.data;
}

export async function updateCommunityFundMemberRole(
  accessToken: string,
  fundId: string,
  userId: string,
  role: CommunityFundMemberRole
) {
  const response = await apiRequest<ApiEnvelope<CommunityFundMember>>(
    `/community-funds/${fundId}/members/${userId}/role`,
    { accessToken, body: JSON.stringify({ role }), method: 'PATCH' }
  );
  return response.data;
}

export async function removeCommunityFundMember(
  accessToken: string,
  fundId: string,
  userId: string
) {
  await apiRequest<ApiEnvelope<null>>(`/community-funds/${fundId}/members/${userId}`, {
    accessToken,
    method: 'DELETE',
  });
}

export async function createDonation(accessToken: string, payload: DonationPayload) {
  const response = await apiRequest<ApiEnvelope<Donation>>('/donations', {
    accessToken,
    body: JSON.stringify(payload),
    method: 'POST',
  });
  return response.data;
}

export async function getMyDonations(accessToken: string) {
  const response = await apiRequest<ApiEnvelope<Donation[]>>('/donations/my-donations', {
    accessToken,
    method: 'GET',
  });
  return response.data;
}

export async function getDonationsByFund(accessToken: string, fundId: string) {
  const response = await apiRequest<ApiEnvelope<Donation[]>>(
    `/community-funds/${fundId}/donations`,
    { accessToken, method: 'GET' }
  );
  return response.data;
}

export async function createExpense(accessToken: string, payload: ExpensePayload) {
  const response = await apiRequest<ApiEnvelope<Expense>>('/expenses', {
    accessToken,
    body: JSON.stringify(payload),
    method: 'POST',
  });
  return response.data;
}

export async function getExpensesByFund(accessToken: string, fundId: string) {
  const response = await apiRequest<ApiEnvelope<Expense[]>>(
    `/community-funds/${fundId}/expenses`,
    { accessToken, method: 'GET' }
  );
  return response.data;
}

export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('en-US', {
    currency: 'VND',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Number(value ?? 0));
}

export function formatFinanceDate(value: string | null | undefined) {
  if (!value) {
    return 'Not available';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('en-US');
}
