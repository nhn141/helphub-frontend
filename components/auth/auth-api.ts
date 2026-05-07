import { Platform } from 'react-native';

export type UserRole = 'REQUESTER' | 'VOLUNTEER' | 'ADMIN' | 'COLLABORATOR';

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: Exclude<UserRole, 'ADMIN' | 'COLLABORATOR'>;
};

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ApiRequestOptions = RequestInit & {
  accessToken?: string;
};

const defaultApiOrigin = Platform.OS === 'android' ? 'http://10.0.2.2:8081' : 'http://localhost:8081';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? `${defaultApiOrigin}/api/v1`
).replace(/\/$/, '');

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return 'Could not connect to the backend. Check the server or EXPO_PUBLIC_API_URL.';
  }

  return 'Something went wrong. Please try again.';
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const { accessToken, headers, body, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);

  if (body && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
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

export async function login(payload: LoginPayload) {
  return apiRequest<AuthSession>('/auth/login', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export async function register(payload: RegisterPayload) {
  return apiRequest<AuthSession>('/auth/register', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
}

export async function refreshToken(refreshToken: string) {
  return apiRequest<AuthSession>('/auth/refresh', {
    body: JSON.stringify({ refreshToken }),
    method: 'POST',
  });
}

export async function getMyProfile(accessToken: string) {
  const response = await apiRequest<ApiEnvelope<UserProfile>>('/users/me', {
    accessToken,
    method: 'GET',
  });

  return response.data;
}
