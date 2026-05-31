import { apiRequest, type ApiEnvelope } from '@/components/auth/auth-api';

export type SupportRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type VolunteerAssignmentStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export type CategorySummary = {
  id: string;
  name: string;
  code: string;
  iconUrl: string | null;
  isActive: boolean;
  createdAt: string;
};

export type SupportRequestSummary = {
  id: string;
  title: string;
  categoryName: string;
  categoryId: string;
  requesterId: string;
  requesterName: string;
  requesterAvatarUrl?: string | null;
  status: SupportRequestStatus;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

export type SupportRequestDetail = SupportRequestSummary & {
  description: string;
  assignedSupportLocationId: string | null;
  assignedSupportLocationName: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  updatedAt: string;
};

export type SupportRequestPayload = {
  title: string;
  description: string;
  categoryId: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export type VolunteerAssignment = {
  supportRequestId: string;
  supportRequestTitle: string;
  supportRequestStatus: SupportRequestStatus;
  requesterId: string;
  requesterName: string;
  volunteerId: string;
  volunteerName: string;
  volunteerEmail: string;
  volunteerPhone: string | null;
  status: VolunteerAssignmentStatus;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  conversationId: string | null;
  assignedAt: string;
  updatedAt: string | null;
};

export function getStatusTone(status: SupportRequestStatus): 'green' | 'mint' | 'amber' | 'slate' | 'red' {
  if (status === 'PENDING') {
    return 'amber';
  }

  if (status === 'REJECTED' || status === 'CANCELLED') {
    return 'red';
  }

  if (status === 'IN_PROGRESS') {
    return 'mint';
  }

  if (status === 'COMPLETED') {
    return 'slate';
  }

  return 'green';
}

export function formatDateTime(value: string | null | undefined) {
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

export async function getCategories(accessToken?: string) {
  const response = await apiRequest<ApiEnvelope<CategorySummary[]>>('/categories', {
    accessToken,
    method: 'GET',
  });

  return response.data;
}

export async function getSupportRequests(accessToken: string, status?: SupportRequestStatus) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await apiRequest<ApiEnvelope<SupportRequestSummary[]>>(
    `/support-requests${query}`,
    {
      accessToken,
      method: 'GET',
    }
  );

  return response.data;
}

export async function getMySupportRequests(accessToken: string) {
  const response = await apiRequest<ApiEnvelope<SupportRequestSummary[]>>(
    '/support-requests/my-requests',
    {
      accessToken,
      method: 'GET',
    }
  );

  return response.data;
}

export async function getSupportRequestById(accessToken: string, id: string) {
  const response = await apiRequest<ApiEnvelope<SupportRequestDetail>>(`/support-requests/${id}`, {
    accessToken,
    method: 'GET',
  });

  return response.data;
}

export async function createSupportRequest(accessToken: string, payload: SupportRequestPayload) {
  const response = await apiRequest<ApiEnvelope<SupportRequestDetail>>('/support-requests', {
    accessToken,
    body: JSON.stringify(payload),
    method: 'POST',
  });

  return response.data;
}

export async function updateSupportRequest(
  accessToken: string,
  id: string,
  payload: SupportRequestPayload
) {
  const response = await apiRequest<ApiEnvelope<SupportRequestDetail>>(`/support-requests/${id}`, {
    accessToken,
    body: JSON.stringify(payload),
    method: 'PUT',
  });

  return response.data;
}

export async function approveSupportRequest(accessToken: string, id: string) {
  const response = await apiRequest<ApiEnvelope<SupportRequestDetail>>(
    `/support-requests/${id}/approve`,
    {
      accessToken,
      method: 'PATCH',
    }
  );

  return response.data;
}

export async function rejectSupportRequest(
  accessToken: string,
  id: string,
  rejectionReason: string
) {
  const response = await apiRequest<ApiEnvelope<SupportRequestDetail>>(
    `/support-requests/${id}/reject`,
    {
      accessToken,
      body: JSON.stringify({ rejectionReason }),
      method: 'PATCH',
    }
  );

  return response.data;
}

export async function assignSupportRequestToLocation(
  accessToken: string,
  id: string,
  supportLocationId: string
) {
  const response = await apiRequest<ApiEnvelope<SupportRequestDetail>>(
    `/support-requests/${id}/assign-support-location`,
    {
      accessToken,
      body: JSON.stringify({ supportLocationId }),
      method: 'PATCH',
    }
  );

  return response.data;
}

export async function applyToSupportRequest(accessToken: string, supportRequestId: string) {
  const response = await apiRequest<ApiEnvelope<VolunteerAssignment>>(
    `/volunteer-assignments/support-requests/${supportRequestId}/apply`,
    {
      accessToken,
      method: 'POST',
    }
  );

  return response.data;
}

export async function cancelMyVolunteerAssignment(accessToken: string, supportRequestId: string) {
  const response = await apiRequest<ApiEnvelope<VolunteerAssignment>>(
    `/volunteer-assignments/support-requests/${supportRequestId}/cancel`,
    {
      accessToken,
      method: 'PATCH',
    }
  );

  return response.data;
}

export async function completeMyVolunteerAssignment(accessToken: string, supportRequestId: string) {
  const response = await apiRequest<ApiEnvelope<VolunteerAssignment>>(
    `/volunteer-assignments/support-requests/${supportRequestId}/complete`,
    {
      accessToken,
      method: 'PATCH',
    }
  );

  return response.data;
}

export async function getMyVolunteerAssignments(accessToken: string) {
  const response = await apiRequest<ApiEnvelope<VolunteerAssignment[]>>(
    '/volunteer-assignments/my-assignments',
    {
      accessToken,
      method: 'GET',
    }
  );

  return response.data;
}

export async function getVolunteerAssignmentsBySupportRequest(
  accessToken: string,
  supportRequestId: string
) {
  const response = await apiRequest<ApiEnvelope<VolunteerAssignment[]>>(
    `/volunteer-assignments/support-requests/${supportRequestId}`,
    {
      accessToken,
      method: 'GET',
    }
  );

  return response.data;
}

export async function approveVolunteerAssignment(
  accessToken: string,
  supportRequestId: string,
  volunteerId: string
) {
  const response = await apiRequest<ApiEnvelope<VolunteerAssignment>>(
    `/volunteer-assignments/support-requests/${supportRequestId}/volunteers/${volunteerId}/approve`,
    {
      accessToken,
      method: 'PATCH',
    }
  );

  return response.data;
}

export async function rejectVolunteerAssignment(
  accessToken: string,
  supportRequestId: string,
  volunteerId: string,
  rejectionReason: string
) {
  const response = await apiRequest<ApiEnvelope<VolunteerAssignment>>(
    `/volunteer-assignments/support-requests/${supportRequestId}/volunteers/${volunteerId}/reject`,
    {
      accessToken,
      body: JSON.stringify({ rejectionReason }),
      method: 'PATCH',
    }
  );

  return response.data;
}

// ─── Support Needs & Contributions ───────────────────────────────────────────

export type SupportType = 'MONEY' | 'GOODS';

export type SupportNeedUnit =
  | 'VND'
  | 'KG'
  | 'PIECE'
  | 'BOX'
  | 'LITER'
  | 'PACKAGE'
  | 'SET'
  | 'PERSON'
  | 'OTHER';

export const SUPPORT_NEED_UNITS: { value: SupportNeedUnit; label: string }[] = [
  { value: 'VND', label: 'VND (money)' },
  { value: 'KG', label: 'KG' },
  { value: 'PIECE', label: 'Piece / Item' },
  { value: 'BOX', label: 'Box / Carton' },
  { value: 'LITER', label: 'Liter' },
  { value: 'PACKAGE', label: 'Package' },
  { value: 'SET', label: 'Set' },
  { value: 'PERSON', label: 'Person' },
  { value: 'OTHER', label: 'Other' },
];

export const SUPPORT_TYPES: { value: SupportType; label: string }[] = [
  { value: 'GOODS', label: 'Goods' },
  { value: 'MONEY', label: 'Money' },
];

export type SupportNeed = {
  id: string;
  supportRequestId: string;
  supportRequestTitle: string;
  supportType: SupportType;
  needName: string;
  unit: SupportNeedUnit;
  requiredQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  isFulfilled: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export type SupportNeedPayload = {
  supportType: SupportType;
  needName: string;
  unit: SupportNeedUnit;
  requiredQuantity: number;
};

export type Contribution = {
  id: string;
  supportNeedId: string;
  needName: string;
  contributorId: string;
  contributorName: string;
  quantity: number;
  note: string | null;
  createdAt: string;
};

export type ContributionPayload = {
  quantity: number;
  note?: string;
};

export async function getSupportNeeds(accessToken: string, supportRequestId: string) {
  const response = await apiRequest<ApiEnvelope<SupportNeed[]>>(
    `/support-requests/${supportRequestId}/needs`,
    { accessToken, method: 'GET' }
  );
  return response.data;
}

export async function createSupportNeed(
  accessToken: string,
  supportRequestId: string,
  payload: SupportNeedPayload
) {
  const response = await apiRequest<ApiEnvelope<SupportNeed>>(
    `/support-requests/${supportRequestId}/needs`,
    { accessToken, method: 'POST', body: JSON.stringify(payload) }
  );
  return response.data;
}

export async function updateSupportNeed(
  accessToken: string,
  needId: string,
  payload: SupportNeedPayload
) {
  const response = await apiRequest<ApiEnvelope<SupportNeed>>(
    `/support-needs/${needId}`,
    { accessToken, method: 'PUT', body: JSON.stringify(payload) }
  );
  return response.data;
}

export async function deleteSupportNeed(accessToken: string, needId: string) {
  await apiRequest<ApiEnvelope<null>>(
    `/support-needs/${needId}`,
    { accessToken, method: 'DELETE' }
  );
}

export async function getContributions(accessToken: string, needId: string) {
  const response = await apiRequest<ApiEnvelope<Contribution[]>>(
    `/support-needs/${needId}/contributions`,
    { accessToken, method: 'GET' }
  );
  return response.data;
}

export async function createContribution(
  accessToken: string,
  needId: string,
  payload: ContributionPayload
) {
  const response = await apiRequest<ApiEnvelope<Contribution>>(
    `/support-needs/${needId}/contributions`,
    { accessToken, method: 'POST', body: JSON.stringify(payload) }
  );
  return response.data;
}
