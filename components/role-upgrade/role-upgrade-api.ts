import { apiRequest, type ApiEnvelope, type UserRole } from '@/components/auth/auth-api';
import type { PageResponse } from '@/components/management/user-api';

export type RoleUpgradeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type RoleUpgradeRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  fromRole: UserRole;
  toRole: UserRole;
  reason: string;
  status: RoleUpgradeRequestStatus;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type RoleUpgradeListParams = {
  status?: RoleUpgradeRequestStatus;
  page?: number;
  size?: number;
};

export type CreateRoleUpgradeRequestPayload = {
  reason: string;
};

export type RejectRoleUpgradeRequestPayload = {
  rejectionReason: string;
};

export async function createMyRoleUpgradeRequest(
  accessToken: string,
  payload: CreateRoleUpgradeRequestPayload
) {
  const response = await apiRequest<ApiEnvelope<RoleUpgradeRequest>>(
    '/role-upgrade-requests/me',
    {
      accessToken,
      body: JSON.stringify(payload),
      method: 'POST',
    }
  );

  return response.data;
}

export async function getMyRoleUpgradeRequests(
  accessToken: string,
  params: RoleUpgradeListParams = {}
) {
  const response = await apiRequest<ApiEnvelope<PageResponse<RoleUpgradeRequest>>>(
    `/role-upgrade-requests/me${buildRoleUpgradeQuery(params)}`,
    {
      accessToken,
      method: 'GET',
    }
  );

  return response.data;
}

export async function getRoleUpgradeRequests(
  accessToken: string,
  params: RoleUpgradeListParams = {}
) {
  const response = await apiRequest<ApiEnvelope<PageResponse<RoleUpgradeRequest>>>(
    `/role-upgrade-requests${buildRoleUpgradeQuery(params)}`,
    {
      accessToken,
      method: 'GET',
    }
  );

  return response.data;
}

export async function approveRoleUpgradeRequest(accessToken: string, id: string) {
  const response = await apiRequest<ApiEnvelope<RoleUpgradeRequest>>(
    `/role-upgrade-requests/${id}/approve`,
    {
      accessToken,
      method: 'PATCH',
    }
  );

  return response.data;
}

export async function rejectRoleUpgradeRequest(
  accessToken: string,
  id: string,
  payload: RejectRoleUpgradeRequestPayload
) {
  const response = await apiRequest<ApiEnvelope<RoleUpgradeRequest>>(
    `/role-upgrade-requests/${id}/reject`,
    {
      accessToken,
      body: JSON.stringify(payload),
      method: 'PATCH',
    }
  );

  return response.data;
}

export function getRoleUpgradeStatusTone(
  status: RoleUpgradeRequestStatus
): 'green' | 'mint' | 'amber' | 'slate' | 'red' {
  if (status === 'PENDING') {
    return 'amber';
  }

  if (status === 'APPROVED') {
    return 'green';
  }

  if (status === 'REJECTED') {
    return 'red';
  }

  return 'slate';
}

export function formatRoleUpgradeDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Not available';
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function buildRoleUpgradeQuery(params: RoleUpgradeListParams) {
  const searchParams = new URLSearchParams();

  if (params.status) {
    searchParams.set('status', params.status);
  }

  searchParams.set('page', String(params.page ?? 0));
  searchParams.set('size', String(params.size ?? 10));

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
