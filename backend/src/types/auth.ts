export type UserRole = "AUTHOR" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  authorCode?: string | null;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}
