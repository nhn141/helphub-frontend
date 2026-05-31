import { apiRequest, type ApiEnvelope } from '@/components/auth/auth-api';

export type CategorySummary = {
  id: string;
  name: string;
  code: string;
  iconUrl: string | null;
  isActive: boolean;
  createdAt: string;
};

export type CategoryDetail = CategorySummary & {
  description: string | null;
  updatedAt: string | null;
};

export type CategoryPayload = {
  name: string;
  code: string;
  description?: string | null;
  iconUrl?: string | null;
};

export type CategoryStatusPayload = {
  isActive: boolean;
};

export async function getCategories(accessToken?: string, activeOnly = true) {
  const response = await apiRequest<ApiEnvelope<CategorySummary[]>>(
    `/categories?activeOnly=${activeOnly}`,
    { accessToken, method: 'GET' }
  );
  return response.data;
}

export async function getCategoryById(accessToken: string, id: string) {
  const response = await apiRequest<ApiEnvelope<CategoryDetail>>(
    `/categories/${id}`,
    { accessToken, method: 'GET' }
  );
  return response.data;
}

export async function createCategory(accessToken: string, payload: CategoryPayload) {
  const response = await apiRequest<ApiEnvelope<CategoryDetail>>('/categories', {
    accessToken,
    method: 'POST',
    body: JSON.stringify(normalizePayload(payload)),
  });
  return response.data;
}

export async function updateCategory(
  accessToken: string,
  id: string,
  payload: CategoryPayload
) {
  const response = await apiRequest<ApiEnvelope<CategoryDetail>>(`/categories/${id}`, {
    accessToken,
    method: 'PUT',
    body: JSON.stringify(normalizePayload(payload)),
  });
  return response.data;
}

export async function updateCategoryStatus(
  accessToken: string,
  id: string,
  payload: CategoryStatusPayload
) {
  const response = await apiRequest<ApiEnvelope<CategoryDetail>>(
    `/categories/${id}/status`,
    {
      accessToken,
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
  return response.data;
}

function normalizePayload(payload: CategoryPayload) {
  return {
    ...payload,
    description: payload.description?.trim() || null,
    iconUrl: payload.iconUrl?.trim() || null,
  };
}
