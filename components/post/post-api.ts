import { apiRequest, ApiError, API_BASE_URL, type ApiEnvelope } from '@/components/auth/auth-api';

// ─────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────

export type PostVisibility = 'PUBLIC' | 'VOLUNTEERS_ONLY';
export type PostStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'HIDDEN' | 'REMOVED';
export type PostReactionType = 'LIKE' | 'LOVE' | 'CARE' | 'SAD' | 'WOW';
export type MediaFileType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';

// ─────────────────────────────────────────────────────────────
// Post types
// ─────────────────────────────────────────────────────────────

export type PostSummary = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  supportRequestId: string | null;
  supportRequestTitle: string | null;
  content: string;
  visibility: PostVisibility;
  status: PostStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PostDetail = PostSummary;

export type CreatePostPayload = {
  content: string;
  visibility: PostVisibility;
  supportRequestId?: string | null;
};

export type UpdatePostPayload = {
  content: string;
  visibility: PostVisibility;
  supportRequestId?: string | null;
};

// ─────────────────────────────────────────────────────────────
// Comment types
// ─────────────────────────────────────────────────────────────

export type PostComment = {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  parentCommentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCommentPayload = {
  content: string;
  parentCommentId?: string | null;
};

export type UpdateCommentPayload = {
  content: string;
};

// ─────────────────────────────────────────────────────────────
// Reaction types
// ─────────────────────────────────────────────────────────────

export type PostReaction = {
  postId: string;
  userId: string;
  userName: string;
  type: PostReactionType;
  createdAt: string;
  updatedAt: string;
};

export type PostReactionCount = {
  postId: string;
  totalCount: number;
  countByType: Record<string, number>;
};

export type CreateReactionPayload = {
  type: PostReactionType;
};

export type UpdateReactionPayload = {
  type: PostReactionType;
};

// ─────────────────────────────────────────────────────────────
// Post Media types
// ─────────────────────────────────────────────────────────────

export type PostMedia = {
  postId: string;
  mediaId: string;
  fileName: string;
  fileUrl: string;
  fileType: MediaFileType;
  mimeType: string;
  fileSize: number;
  altText: string | null;
  isPublic: boolean;
  displayOrder: number | null;
  attachedAt: string;
};

export type AttachMediaPayload = {
  mediaId: string;
  displayOrder?: number | null;
};

export type CreateMediaPayload = {
  fileName: string;
  fileUrl: string;
  fileType: MediaFileType;
  mimeType: string;
  fileSize: number;
  altText?: string | null;
  isPublic: boolean;
};

export type MediaDetailResponse = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: MediaFileType;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  altText: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

// ─────────────────────────────────────────────────────────────
// Path helpers
// ─────────────────────────────────────────────────────────────

/**
 * PostController uses `/api/posts` (no `/v1/` prefix), while
 * API_BASE_URL points to `.../api/v1`. We compute a separate
 * base for the post endpoints.
 */
const POST_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '/api');

async function postApiRequest<T>(path: string, options: Parameters<typeof apiRequest>[1] = {}) {
  const { headers, body, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (body && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (rest.accessToken) {
    requestHeaders.set('Authorization', `Bearer ${rest.accessToken}`);
  }

  const response = await fetch(`${POST_BASE_URL}${path}`, {
    ...rest,
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

// ─────────────────────────────────────────────────────────────
// Post CRUD  —  base path /api/posts
// ─────────────────────────────────────────────────────────────

export async function getAllPosts(accessToken: string) {
  const response = await postApiRequest<ApiEnvelope<PostSummary[]>>('/posts', {
    accessToken,
    method: 'GET',
  });
  return response.data;
}

export async function getMyPosts(accessToken: string) {
  const response = await postApiRequest<ApiEnvelope<PostSummary[]>>('/posts/my-posts', {
    accessToken,
    method: 'GET',
  });
  return response.data;
}

export async function getPostById(accessToken: string, id: string) {
  const response = await postApiRequest<ApiEnvelope<PostDetail>>(`/posts/${id}`, {
    accessToken,
    method: 'GET',
  });
  return response.data;
}

export async function createPost(accessToken: string, payload: CreatePostPayload) {
  const response = await postApiRequest<ApiEnvelope<PostDetail>>('/posts', {
    accessToken,
    body: JSON.stringify(payload),
    method: 'POST',
  });
  return response.data;
}

export async function updatePost(accessToken: string, id: string, payload: UpdatePostPayload) {
  const response = await postApiRequest<ApiEnvelope<PostDetail>>(`/posts/${id}`, {
    accessToken,
    body: JSON.stringify(payload),
    method: 'PUT',
  });
  return response.data;
}

export async function deletePost(accessToken: string, id: string) {
  const response = await postApiRequest<ApiEnvelope<null>>(`/posts/${id}`, {
    accessToken,
    method: 'DELETE',
  });
  return response;
}

// ─────────────────────────────────────────────────────────────
// Comments  —  base path /api/v1
// ─────────────────────────────────────────────────────────────

export async function getCommentsByPost(accessToken: string, postId: string) {
  const response = await apiRequest<ApiEnvelope<PostComment[]>>(
    `/posts/${postId}/comments`,
    { accessToken, method: 'GET' },
  );
  return response.data;
}

export async function createComment(
  accessToken: string,
  postId: string,
  payload: CreateCommentPayload,
) {
  const response = await apiRequest<ApiEnvelope<PostComment>>(
    `/posts/${postId}/comments`,
    { accessToken, body: JSON.stringify(payload), method: 'POST' },
  );
  return response.data;
}

export async function updateComment(
  accessToken: string,
  commentId: string,
  payload: UpdateCommentPayload,
) {
  const response = await apiRequest<ApiEnvelope<PostComment>>(
    `/comments/${commentId}`,
    { accessToken, body: JSON.stringify(payload), method: 'PATCH' },
  );
  return response.data;
}

export async function deleteComment(accessToken: string, commentId: string) {
  return apiRequest<ApiEnvelope<null>>(
    `/comments/${commentId}`,
    { accessToken, method: 'DELETE' },
  );
}

export async function getRepliesByComment(accessToken: string, commentId: string) {
  const response = await apiRequest<ApiEnvelope<PostComment[]>>(
    `/comments/${commentId}/replies`,
    { accessToken, method: 'GET' },
  );
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// Reactions  —  base path /api/v1/posts
// ─────────────────────────────────────────────────────────────

export async function createReaction(
  accessToken: string,
  postId: string,
  payload: CreateReactionPayload,
) {
  const response = await apiRequest<ApiEnvelope<PostReaction>>(
    `/posts/${postId}/reactions`,
    { accessToken, body: JSON.stringify(payload), method: 'POST' },
  );
  return response.data;
}

export async function updateReaction(
  accessToken: string,
  postId: string,
  payload: UpdateReactionPayload,
) {
  const response = await apiRequest<ApiEnvelope<PostReaction>>(
    `/posts/${postId}/reactions`,
    { accessToken, body: JSON.stringify(payload), method: 'PATCH' },
  );
  return response.data;
}

export async function deleteReaction(accessToken: string, postId: string) {
  return apiRequest<ApiEnvelope<null>>(
    `/posts/${postId}/reactions`,
    { accessToken, method: 'DELETE' },
  );
}

export async function getMyReaction(accessToken: string, postId: string) {
  const response = await apiRequest<ApiEnvelope<PostReaction>>(
    `/posts/${postId}/reactions/me`,
    { accessToken, method: 'GET' },
  );
  return response.data;
}

export async function getReactionCount(accessToken: string, postId: string) {
  const response = await apiRequest<ApiEnvelope<PostReactionCount>>(
    `/posts/${postId}/reactions/count`,
    { accessToken, method: 'GET' },
  );
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// Post Media  —  base path /api/v1/posts
// ─────────────────────────────────────────────────────────────

export async function getMediaByPost(accessToken: string, postId: string) {
  const response = await apiRequest<ApiEnvelope<PostMedia[]>>(
    `/posts/${postId}/media`,
    { accessToken, method: 'GET' },
  );
  return response.data;
}

export async function createMediaRecord(
  accessToken: string,
  payload: CreateMediaPayload,
) {
  const response = await apiRequest<ApiEnvelope<MediaDetailResponse>>(
    `/media`,
    { accessToken, body: JSON.stringify(payload), method: 'POST' },
  );
  return response.data;
}

export async function attachMediaToPost(
  accessToken: string,
  postId: string,
  payload: AttachMediaPayload,
) {
  const response = await apiRequest<ApiEnvelope<PostMedia>>(
    `/posts/${postId}/media`,
    { accessToken, body: JSON.stringify(payload), method: 'POST' },
  );
  return response.data;
}

export async function removeMediaFromPost(
  accessToken: string,
  postId: string,
  mediaId: string,
) {
  return apiRequest<ApiEnvelope<null>>(
    `/posts/${postId}/media/${mediaId}`,
    { accessToken, method: 'DELETE' },
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export function formatPostDateTime(value: string | null | undefined) {
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

/** Human-readable reaction emoji */
export const reactionEmojis: Record<PostReactionType, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  CARE: '🤗',
  SAD: '😢',
  WOW: '😮',
};
