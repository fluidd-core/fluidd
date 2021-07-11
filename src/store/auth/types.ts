import { JwtPayload } from 'jwt-decode'

export interface AuthState {
  authenticated: boolean;
  token: string | null;
  token_decoded: JwtPayload | null;
  refresh_token: string | null;
  refresh_token_decoded: JwtPayload | null;
  currentUser: AppUser | null;
  users: AppUser[];
  apiKey: string;
}

export interface AppUser {
  username: string;
  created_on: number;
}
