import {
  API_BASE_URL,
  ApiError,
  type ApiEnvelope,
} from '@/components/auth/auth-api';

export type UserStatistics = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  requesters: number;
  volunteers: number;
  collaborators: number;
  admins: number;
};

export type SupportRequestStatistics = {
  totalSupportRequests: number;
  pending: number;
  approved: number;
  inProgress: number;
  rejected: number;
  completed: number;
  cancelled: number;
};

export type CategoryStatistics = {
  totalCategories: number;
  activeCategories: number;
  categories: { categoryId: string; categoryName: string; supportRequestCount: number }[];
};

export type PostStatistics = {
  totalPosts: number;
  active: number;
  underReview: number;
  hidden: number;
  removed: number;
};

export type ReportStatistics = {
  totalReports: number;
  supportRequestReports: number;
  postReports: number;
  userReports: number;
  pending: number;
  reviewed: number;
  resolved: number;
};

export type AdminDashboardStatistics = {
  users: UserStatistics;
  supportRequests: SupportRequestStatistics;
  categories: CategoryStatistics;
  posts: PostStatistics;
  reports: ReportStatistics;
};

const ADMIN_DASHBOARD_BASE_URL = API_BASE_URL.replace(
  /\/api\/v1\/?$/,
  '/api/admin/dashboard'
);

async function getDashboardSection<T>(accessToken: string, path: string) {
  const response = await fetch(`${ADMIN_DASHBOARD_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await response.text();
  let payload: ApiEnvelope<T> | null = null;

  if (text) {
    try {
      payload = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      payload = null;
    }
  }

  if (!response.ok || !payload) {
    throw new ApiError(payload?.message || 'Could not load dashboard statistics.', response.status);
  }

  return payload.data;
}

export async function getAdminDashboardStatistics(
  accessToken: string
): Promise<AdminDashboardStatistics> {
  const [users, supportRequests, categories, posts, reports] = await Promise.all([
    getDashboardSection<UserStatistics>(accessToken, '/users'),
    getDashboardSection<SupportRequestStatistics>(accessToken, '/support-requests'),
    getDashboardSection<CategoryStatistics>(accessToken, '/categories'),
    getDashboardSection<PostStatistics>(accessToken, '/posts'),
    getDashboardSection<ReportStatistics>(accessToken, '/reports'),
  ]);

  return { users, supportRequests, categories, posts, reports };
}
