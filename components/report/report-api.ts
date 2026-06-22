import {
  API_BASE_URL,
  ApiError,
  type ApiEnvelope,
  type ApiRequestOptions,
} from '@/components/auth/auth-api';

export type ReportTargetType = 'POST' | 'SUPPORT_REQUEST' | 'USER';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED';

export type ReportSummary = {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  status: ReportStatus;
  createdAt: string;
};

export type ReportDetail = ReportSummary & {
  reporterAvatarUrl: string | null;
  reason: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  resolutionNote: string | null;
  updatedAt: string | null;
};

export type CreateReportPayload = {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
};

export type ReviewReportPayload = {
  resolutionNote: string;
};

export type ResolveReportPayload = {
  resolutionNote: string;
  supportRequestRejectionReason?: string;
};

const REPORT_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '/api');

async function reportApiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const { accessToken, headers, body, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);

  if (body && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${REPORT_BASE_URL}${path}`, {
    ...requestOptions,
    body,
    headers: requestHeaders,
  });

  const text = await response.text();
  let payload: any = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload?.message === 'string' && payload.message.length > 0
        ? payload.message
        : 'Request failed.';

    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export async function createReport(accessToken: string, payload: CreateReportPayload) {
  const response = await reportApiRequest<ApiEnvelope<ReportDetail>>('/reports', {
    accessToken,
    body: JSON.stringify(payload),
    method: 'POST',
  });

  return response.data;
}

export async function getMyReports(accessToken: string) {
  const response = await reportApiRequest<ApiEnvelope<ReportSummary[]>>(
    '/reports/my-reports',
    {
      accessToken,
      method: 'GET',
    }
  );

  return response.data;
}

export async function getAllReports(accessToken: string) {
  const response = await reportApiRequest<ApiEnvelope<ReportSummary[]>>('/reports', {
    accessToken,
    method: 'GET',
  });

  return response.data;
}

export async function getPendingReports(accessToken: string) {
  const response = await reportApiRequest<ApiEnvelope<ReportSummary[]>>('/reports/pending', {
    accessToken,
    method: 'GET',
  });

  return response.data;
}

export async function getReportById(accessToken: string, id: string) {
  const response = await reportApiRequest<ApiEnvelope<ReportDetail>>(`/reports/${id}`, {
    accessToken,
    method: 'GET',
  });

  return response.data;
}

export async function reviewReport(
  accessToken: string,
  id: string,
  payload: ReviewReportPayload
) {
  const response = await reportApiRequest<ApiEnvelope<ReportDetail>>(
    `/reports/${id}/review`,
    {
      accessToken,
      body: JSON.stringify(payload),
      method: 'PATCH',
    }
  );

  return response.data;
}

export async function resolveReport(
  accessToken: string,
  id: string,
  payload: ResolveReportPayload
) {
  const response = await reportApiRequest<ApiEnvelope<ReportDetail>>(
    `/reports/${id}/resolve`,
    {
      accessToken,
      body: JSON.stringify(payload),
      method: 'PATCH',
    }
  );

  return response.data;
}

export function getReportTargetLabel(targetType: ReportTargetType) {
  if (targetType === 'POST') {
    return 'Post';
  }

  if (targetType === 'SUPPORT_REQUEST') {
    return 'Support request';
  }

  return 'User';
}

export function getReportStatusTone(
  status: ReportStatus
): 'green' | 'mint' | 'amber' | 'slate' | 'red' {
  if (status === 'PENDING') {
    return 'amber';
  }

  if (status === 'REVIEWED') {
    return 'mint';
  }

  return 'slate';
}

export function formatReportDateTime(value: string | null | undefined) {
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
