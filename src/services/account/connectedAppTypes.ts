/**
 * The connected-apps call's shape (KAN-905). A leaf module, so `api.ts` can
 * name it without reaching `connectedApps.ts` (which reads `model.ts`, which
 * reads `api.ts`): that would be an import cycle, as with `tokenTypes.ts`.
 */

/** One app as `GET /v1/me/connected-apps` lists it. Times are seconds. */
export interface ConnectedApp {
  client_id: string;
  /** The app's own claim. null when its registration is gone. */
  name: string | null;
  /** Added by Muon3D by hand (true); registered itself (false). */
  verified: boolean;
  /** false: the app's registration was removed. */
  known: boolean;
  /** Where it sends people back to after they approve it. */
  redirect_hosts: string[];
  /** Self-registered only: the site the app named. */
  client_uri?: string | null;
  /** Self-registered only. Not shown: loading it would tell the app's host who is looking. */
  logo_uri?: string | null;
  scopes: string[];
  /** null when there is a session but no approval on record. */
  approved_at: number | null;
  /** null when it holds no live session. */
  last_used_at: number | null;
  /** Live sessions it holds for this account. */
  sessions: number;
  /** The app this page runs in (Control itself): not disconnected from here. */
  current: boolean;
}
