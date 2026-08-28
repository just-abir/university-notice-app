import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, ENDPOINTS } from '@/constants/api';
import { useAuthStore } from '@/store/authStore';
import {
  Notice,
  Comment,
  StudentGroup,
  TargetAudience,
  Pagination,
  User,
  ReadStatusResponse,
} from '@/types';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: Attach Token ───────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Auto Refresh on 401 ───────────────────────────────
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};
const onRefreshSuccess = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { loadStoredTokens, setAccessToken, logout } = useAuthStore.getState();
        const { refreshToken } = await loadStoredTokens();

        if (!refreshToken) {
          await logout();
          return Promise.reject(error);
        }

        const res = await axios.post(`${API_BASE_URL}${ENDPOINTS.REFRESH}`, { refreshToken });
        const newAccessToken = res.data.data.accessToken;

        await setAccessToken(newAccessToken);
        onRefreshSuccess(newAccessToken);

        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch {
        await useAuthStore.getState().logout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const extractData = <T>(res: { data: { success: boolean; data?: T } }): T => {
  return res.data.data as T;
};

// ═════════════════════════════════════════════════════════════════════════════
// Auth API
// ═════════════════════════════════════════════════════════════════════════════
export const authAPI = {
  login: (email: string, password: string) =>
    api.post(ENDPOINTS.LOGIN, { email, password }).then((r) =>
      extractData<{ user: User; accessToken: string; refreshToken: string }>(r)
    ),

  getMe: () =>
    api.get(ENDPOINTS.ME).then((r) => extractData<{ user: User }>(r)),

  updateMe: (data: { name?: string; profilePicture?: string; expoPushToken?: string }) =>
    api.put(ENDPOINTS.UPDATE_ME, data).then((r) => extractData<{ user: User }>(r)),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.put(ENDPOINTS.CHANGE_PASSWORD, { oldPassword, newPassword }).then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post(ENDPOINTS.FORGOT_PASSWORD, { email }).then((r) => r.data),

  resetPassword: (token: string, newPassword: string) =>
    api.post(ENDPOINTS.RESET_PASSWORD, { token, newPassword }).then((r) => r.data),

  logout: () => api.post(ENDPOINTS.LOGOUT).then((r) => r.data),
};

// ═════════════════════════════════════════════════════════════════════════════
// Notices API
// ═════════════════════════════════════════════════════════════════════════════
export const noticesAPI = {
  // Teacher: get own notices
  getMyNotices: (page = 1, limit = 20, search?: string) =>
    api
      .get(ENDPOINTS.NOTICES, { params: { page, limit, ...(search && { search }) } })
      .then((r) => extractData<{ notices: Notice[]; pagination: Pagination }>(r)),

  // Teacher: create notice (supports FormData for PDF)
  createNotice: (formData: FormData) =>
    api
      .post(ENDPOINTS.NOTICES, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => extractData<{ notice: Notice }>(r)),

  // Shared: get notice detail
  getNotice: (id: string) =>
    api.get(ENDPOINTS.NOTICE_DETAIL(id)).then((r) => extractData<{ notice: Notice }>(r)),

  // Teacher: update notice
  updateNotice: (id: string, data: FormData | Partial<Notice>) => {
    const isFormData = data instanceof FormData;
    return api
      .put(ENDPOINTS.UPDATE_NOTICE(id), data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      })
      .then((r) => extractData<{ notice: Notice }>(r));
  },

  // Teacher: delete notice
  deleteNotice: (id: string) => api.delete(ENDPOINTS.DELETE_NOTICE(id)).then((r) => r.data),

  // Student: notice feed
  getFeed: (page = 1, limit = 20, filter?: 'read' | 'unread') =>
    api
      .get(ENDPOINTS.NOTICE_FEED, { params: { page, limit, ...(filter && { filter }) } })
      .then((r) => extractData<{ notices: Notice[]; pagination: Pagination }>(r)),

  // Student: mark as read
  markAsRead: (id: string) => api.post(ENDPOINTS.MARK_AS_READ(id)).then((r) => r.data),

  // Teacher: get read status
  getReadStatus: (id: string) =>
    api.get(ENDPOINTS.NOTICE_READ_STATUS(id)).then((r) => extractData<ReadStatusResponse>(r)),
};

// ═════════════════════════════════════════════════════════════════════════════
// Comments API
// ═════════════════════════════════════════════════════════════════════════════
export const commentsAPI = {
  getComments: (noticeId: string) =>
    api
      .get(ENDPOINTS.GET_COMMENTS(noticeId))
      .then((r) => extractData<{ comments: Comment[]; total: number }>(r)),

  addComment: (noticeId: string, body: string) =>
    api
      .post(ENDPOINTS.ADD_COMMENT(noticeId), { body })
      .then((r) => extractData<{ comment: Comment }>(r)),

  deleteComment: (noticeId: string, commentId: string) =>
    api.delete(ENDPOINTS.DELETE_COMMENT(noticeId, commentId)).then((r) => r.data),
};

// ═════════════════════════════════════════════════════════════════════════════
// Students API
// ═════════════════════════════════════════════════════════════════════════════
export const studentsAPI = {
  search: (params: {
    name?: string;
    roll?: string;
    year?: number;
    batch?: string;
    gender?: string;
    page?: number;
    limit?: number;
  }) =>
    api
      .get(ENDPOINTS.SEARCH_STUDENTS, { params })
      .then((r) => extractData<{ students: User[]; pagination: Pagination }>(r)),

  resolveAudience: (targetAudience: TargetAudience) =>
    api
      .post(ENDPOINTS.RESOLVE_AUDIENCE, { targetAudience })
      .then((r) => extractData<{ count: number; sample: User[]; hasMore: boolean }>(r)),

  getByYear: (years: number[]) =>
    api
      .get(ENDPOINTS.STUDENTS_BY_YEAR, { params: { years: years.join(',') } })
      .then((r) => extractData<{ students: User[]; total: number }>(r)),
};

// ═════════════════════════════════════════════════════════════════════════════
// Groups API
// ═════════════════════════════════════════════════════════════════════════════
export const groupsAPI = {
  getGroups: () =>
    api.get(ENDPOINTS.GROUPS).then((r) => extractData<{ groups: StudentGroup[] }>(r)),

  createGroup: (data: { name: string; description?: string; memberIds: string[] }) =>
    api.post(ENDPOINTS.GROUPS, data).then((r) => extractData<{ group: StudentGroup }>(r)),

  updateGroup: (id: string, data: { name?: string; description?: string; memberIds?: string[] }) =>
    api
      .put(ENDPOINTS.GROUP_DETAIL(id), data)
      .then((r) => extractData<{ group: StudentGroup }>(r)),

  deleteGroup: (id: string) => api.delete(ENDPOINTS.GROUP_DETAIL(id)).then((r) => r.data),
};

export default api;
