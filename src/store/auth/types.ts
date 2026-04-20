import type { JwtPayload } from 'jwt-decode'

export interface AuthState {
  token: JwtPayload | null;
  refresh_token: JwtPayload | null;
  currentUser: AppUser | null;
  users: AppUser[];
  apiKey: string;
}

export interface AppUser {
  username: string;
  password?: string;
  source: string;
  created_on?: number;
}
