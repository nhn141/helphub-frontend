import { apiRequest, type ApiEnvelope, type UserRole } from '@/components/auth/auth-api';

export type { UserRole };

export type UserSummary = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
};

export type UserDetail = UserSummary & {
  updatedAt: string | null;
  lastLoginAt: string | null;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
};

export type UserListParams = {
  keyword?: string;
  role?: UserRole;
  page?: number;
  size?: number;
  sort?: string;
};

export type UpdateUserRolePayload = {
  role: UserRole;
};

export type UpdateUserStatusPayload = {
  isActive: boolean;
};

export async function getUsers(accessToken: string, params: UserListParams = {}) {
  const response = await apiRequest<ApiEnvelope<PageResponse<UserSummary>>>(
    `/users${buildUserQuery(params)}`,
    {
      accessToken,
      method: 'GET',
    }
  );

  return response.data;
}

export async function getUserById(accessToken: string, id: string) {
  const response = await apiRequest<ApiEnvelope<UserDetail>>(`/users/${id}`, {
    accessToken,
    method: 'GET',
  });

  return response.data;
}

export async function updateUserRole(
  accessToken: string,
  id: string,
  payload: UpdateUserRolePayload
) {
  const response = await apiRequest<ApiEnvelope<UserDetail>>(`/users/${id}/role`, {
    accessToken,
    body: JSON.stringify(payload),
    method: 'PATCH',
  });

  return response.data;
}

export async function updateUserStatus(
  accessToken: string,
  id: string,
  payload: UpdateUserStatusPayload
) {
  const response = await apiRequest<ApiEnvelope<UserDetail>>(`/users/${id}/status`, {
    accessToken,
    body: JSON.stringify(payload),
    method: 'PATCH',
  });

  return response.data;
}

export function formatUserDateTime(value: string | null | undefined) {
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

function buildUserQuery(params: UserListParams) {
  const searchParams = new URLSearchParams();
  const keyword = params.keyword?.trim();

  if (keyword) {
    searchParams.set('keyword', keyword);
  }

  if (params.role) {
    searchParams.set('role', params.role);
  }

  searchParams.set('page', String(params.page ?? 0));
  searchParams.set('size', String(params.size ?? 10));
  searchParams.set('sort', params.sort ?? 'createdAt,desc');

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
