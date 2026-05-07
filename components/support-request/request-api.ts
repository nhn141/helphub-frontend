import { apiRequest, type ApiEnvelope } from '@/components/auth/auth-api';

export type SupportRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

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
