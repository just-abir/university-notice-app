export const API_BASE_URL = "http://192.168.0.87:5000/api";
// Note: Use 10.0.2.2 for Android Emulator, localhost for iOS Simulator
// For physical devices, use your machine's local IP: http://192.168.x.x:5000/api

export const ENDPOINTS = {
  // ── Auth ────────────────────────────────────────────────────────────────────
  LOGIN: "/auth/login",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
  ME: "/auth/me",
  UPDATE_ME: "/auth/me",
  CHANGE_PASSWORD: "/auth/change-password",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",

  // ── Notices (Teacher) ────────────────────────────────────────────────────────
  NOTICES: "/notices",
  NOTICE_DETAIL: (id: string) => `/notices/${id}`,
  UPDATE_NOTICE: (id: string) => `/notices/${id}`,
  DELETE_NOTICE: (id: string) => `/notices/${id}`,
  NOTICE_READ_STATUS: (id: string) => `/notices/${id}/read-status`,

  // ── Notices (Student) ────────────────────────────────────────────────────────
  NOTICE_FEED: "/notices/feed",
  MARK_AS_READ: (id: string) => `/notices/${id}/read`,

  // ── Comments ─────────────────────────────────────────────────────────────────
  GET_COMMENTS: (id: string) => `/notices/${id}/comments`,
  ADD_COMMENT: (id: string) => `/notices/${id}/comments`,
  DELETE_COMMENT: (noticeId: string, commentId: string) =>
    `/notices/${noticeId}/comments/${commentId}`,

  // ── Students ─────────────────────────────────────────────────────────────────
  SEARCH_STUDENTS: "/students/search",
  RESOLVE_AUDIENCE: "/students/resolve-audience",

  // ── Admin / Groups ────────────────────────────────────────────────────────────
  IMPORT_STUDENTS: "/admin/import/students",
  IMPORT_TEACHERS: "/admin/import/teachers",
  ALL_USERS: "/admin/users",
  GROUPS: "/admin/groups",
  GROUP_DETAIL: (id: string) => `/admin/groups/${id}`,
} as const;
