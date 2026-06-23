export interface AuthState {
  currentUser: AppUser | null;
  users: AppUser[];
  apiKey: string;
}

export interface AppUser {
  username: string;
  source: string;
  created_on?: number;
}
