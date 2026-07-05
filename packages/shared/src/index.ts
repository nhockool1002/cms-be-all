export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LastPostSummary {
  authorUsername: string;
  createdAt: string;
}

export interface BoardLastPostSummary extends LastPostSummary {
  threadId: string;
  threadTitle: string;
}

export interface Board {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  description: string | null;
  displayOrder: number;
  threadCount: number;
  postCount: number;
  lastPost: BoardLastPostSummary | null;
}

export interface Thread {
  id: string;
  boardId: string;
  boardSlug?: string;
  boardName?: string;
  authorId: string;
  authorUsername: string;
  title: string;
  slug: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  createdAt: string;
  lastPostAt: string | null;
  lastPost: LastPostSummary | null;
}

export interface PostAuthorSummary {
  username: string;
  avatarUrl: string | null;
  joinedAt: string;
  postCount: number;
  roles: string[];
  rankTitle: string;
}

export interface Post {
  id: string;
  threadId: string;
  authorId: string;
  author: PostAuthorSummary;
  bodyMarkdown: string;
  bodyHtml: string;
  createdAt: string;
  editedAt: string | null;
}

export type PageStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Page {
  id: string;
  slug: string;
  title: string;
  status: PageStatus;
  authorId: string;
  bodyMarkdown: string;
  bodyHtml: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  joinedAt: string;
  roles: string[];
  rankTitle: string;
  postCount: number;
  threadCount: number;
  followerCount: number;
  followingCount: number;
}

export interface ProfileComment {
  id: string;
  profileUserId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author: { username: string };
}
