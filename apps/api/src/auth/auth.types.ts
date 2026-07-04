export interface AuthenticatedUser {
  id: string;
  username: string;
  roles: string[];
}

export interface JwtPayload {
  sub: string;
  username: string;
  roles: string[];
}
