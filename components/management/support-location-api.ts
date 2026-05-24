import { apiRequest, type ApiEnvelope } from '@/components/auth/auth-api';

export type SupportLocationSummary = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  contactPhone: string | null;
  isActive: boolean;
  createdAt: string;
};

export type SupportLocationDetail = SupportLocationSummary & {
  description: string;
  createdBy: string;
  createdByName: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  updatedAt: string | null;
};

export type SupportLocationPayload = {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  contactPhone?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
};

export type SupportLocationStatusPayload = {
  isActive: boolean;
};

export async function getSupportLocations(accessToken: string, activeOnly = false) {
  const response = await apiRequest<ApiEnvelope<SupportLocationSummary[]>>(
    `/support-locations?activeOnly=${activeOnly}`,
    {
      accessToken,
      method: 'GET',
    }
  );

  return response.data;
}

export async function getMyCreatedSupportLocations(accessToken: string) {
  const response = await apiRequest<ApiEnvelope<SupportLocationSummary[]>>(
    '/support-locations/my-created',
    {
      accessToken,
      method: 'GET',
    }
  );

  return response.data;
}

export async function getSupportLocationById(accessToken: string, id: string) {
  const response = await apiRequest<ApiEnvelope<SupportLocationDetail>>(
    `/support-locations/${id}`,
    {
      accessToken,
      method: 'GET',
    }
  );

  return response.data;
}

export async function createSupportLocation(
  accessToken: string,
  payload: SupportLocationPayload
) {
  const response = await apiRequest<ApiEnvelope<SupportLocationDetail>>('/support-locations', {
    accessToken,
    body: JSON.stringify(normalizePayload(payload)),
    method: 'POST',
  });

  return response.data;
}

export async function updateSupportLocation(
  accessToken: string,
  id: string,
  payload: SupportLocationPayload
) {
  const response = await apiRequest<ApiEnvelope<SupportLocationDetail>>(
    `/support-locations/${id}`,
    {
      accessToken,
      body: JSON.stringify(normalizePayload(payload)),
      method: 'PUT',
    }
  );

  return response.data;
}

export async function updateSupportLocationStatus(
  accessToken: string,
  id: string,
  payload: SupportLocationStatusPayload
) {
  const response = await apiRequest<ApiEnvelope<SupportLocationDetail>>(
    `/support-locations/${id}/status`,
    {
      accessToken,
      body: JSON.stringify(payload),
      method: 'PATCH',
    }
  );

  return response.data;
}

export function formatLocationDateTime(value: string | null | undefined) {
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

export function formatCoordinate(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Not available';
  }

  return value.toFixed(5);
}

function normalizePayload(payload: SupportLocationPayload) {
  return {
    ...payload,
    contactPhone: normalizeOptional(payload.contactPhone),
    bankName: normalizeOptional(payload.bankName),
    bankAccountNumber: normalizeOptional(payload.bankAccountNumber),
  };
}

function normalizeOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
