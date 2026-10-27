/**
 * The shapes of the token calls (KAN-904). A leaf module, so `api.ts` can
 * name them without reaching `tokens.ts` (which reads `model.ts`, which reads
 * `api.ts`): that was an import cycle.
 */

export type TokenStatus = 'active' | 'expired' | 'revoked'
export type AskMode = 'ask' | 'bypass'

/** One token as `GET /v1/tokens` lists it. No secret. Times are seconds. */
export interface PersonalToken {
  id: string;
  name: string;
  /** The first 8 characters: `mpat_Ab3`. */
  prefix: string;
  scopes: string[];
  /** null: every printer the account owns. [] : none. */
  printer_ids: string[] | null;
  ask_mode: AskMode;
  bypass_until?: number | null;
  expires_at: number;
  created_at: number;
  last_used_at?: number | null;
  last_used_ip?: string | null;
  revoked_at?: number | null;
  status: TokenStatus;
}

/** The create call's answer: the token, with the secret. Shown once. */
export interface CreatedToken extends PersonalToken {
  token: string;
}

export interface CreateTokenBody {
  name: string;
  scopes: string[];
  /** Absent: every printer the account owns. */
  printer_ids?: string[];
  expires_in_days: number;
  ask_mode: AskMode;
  /** With Bypass: 1 or 8. Absent: until the token ends. */
  bypass_hours?: 1 | 8;
}
