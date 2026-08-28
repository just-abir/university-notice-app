// ─── User Types ───────────────────────────────────────────────────────────────
export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  gender?: Gender;
  profilePicture?: string;
  isActive: boolean;
  mustChangePassword: boolean;
  expoPushToken?: string;
  // Student fields
  roll?: string;
  registrationNo?: string;
  batch?: string;
  year?: 1 | 2 | 3 | 4 | 5;
  semester?: number;
  phone?: string;
  address?: string;
  // Teacher fields
  designation?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Audience Types ───────────────────────────────────────────────────────────
export type AudienceType =
  | 'SPECIFIC_ROLL'
  | 'ROLL_RANGE'
  | 'YEAR_ALL'
  | 'YEAR_FEMALE'
  | 'ALL_CSE'
  | 'ALL_CSE_FEMALE'
  | 'CUSTOM_GROUP'
  | 'SELECTED_STUDENTS';

export interface TargetAudience {
  type: AudienceType;
  rolls?: string[];
  rollStart?: string;
  rollEnd?: string;
  year?: number;
  batch?: string;
  customGroupId?: string;
  selectedIds?: string[];
}

// ─── Notice Types ─────────────────────────────────────────────────────────────
export type NoticeType = 'TEXT' | 'PDF';

export interface ReadEntry {
  student: User | string;
  readAt: string;
}

export interface Notice {
  _id: string;
  title: string;
  body?: string;
  type: NoticeType;
  pdfUrl?: string;
  pdfPublicId?: string;
  author: User;
  targetAudience: TargetAudience;
  resolvedRecipients?: string[];
  readBy?: ReadEntry[];
  recipientCount?: number;
  readCount?: number;
  unreadCount?: number;
  isDeleted: boolean;
  isRead?: boolean;
  audienceDescription?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Comment Types ────────────────────────────────────────────────────────────
export interface Comment {
  _id: string;
  notice: string;
  author: User;
  body: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Student Group Types ──────────────────────────────────────────────────────
export interface StudentGroup {
  _id: string;
  name: string;
  description?: string;
  createdBy: User;
  members: User[];
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ReadStatusResponse {
  noticeId: string;
  title: string;
  totalRecipients: number;
  readCount: number;
  unreadCount: number;
  readPercentage: number;
  read: ReadEntry[];
  unread: User[];
}
