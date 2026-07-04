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

export interface Board {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  description: string | null;
  displayOrder: number;
}

export interface Thread {
  id: string;
  boardId: string;
  authorId: string;
  title: string;
  slug: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  lastPostAt: string | null;
}

export interface Post {
  id: string;
  threadId: string;
  authorId: string;
  bodyMarkdown: string;
  bodyHtml: string;
  createdAt: string;
  editedAt: string | null;
}
