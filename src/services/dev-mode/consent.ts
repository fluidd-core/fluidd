import { httpClientActions } from '@/api/httpClientActions'

/**
 * Whether the person at the printer has answered a developer-mode challenge.
 *
 * The Aux API's route has the challenge in its path
 * (`/dev_mode/consent/{challenge_id}`), and Moonraker's aux_api_proxy does not
 * give such routes an address of their own: it registers only the routes
 * without `{…}`, and reaches the rest through `POST /server/aux/proxy` with
 * the Aux path and method, checked against the routes Aux declares (KAN-83).
 * Asked at `/server/aux/dev_mode/consent/<id>`, Moonraker answers its own 404
 * every time, so a knob press was never seen (KAN-518, measured on Boxwood).
 */
export interface ConsentAnswer {
  confirmed: boolean;
  refused: boolean;
}

/** A challenge id as the Aux API makes them; anything else is never sent, so it cannot name another route. */
const CHALLENGE_ID = /^[A-Za-z0-9_-]{1,128}$/

export function consentProxyRequest (challengeId: string): { path: string, method: 'GET' } {
  if (!CHALLENGE_ID.test(challengeId)) throw new Error('not a challenge id')
  return { path: `/dev_mode/consent/${challengeId}`, method: 'GET' }
}

/** The answer in Moonraker's reply (`{ result: … }`), or what Aux said straight. */
export function consentAnswerOf (data: unknown): ConsentAnswer | null {
  const body = data && typeof data === 'object' && 'result' in data ? (data as { result: unknown }).result : data
  if (!body || typeof body !== 'object') return null
  const { confirmed, refused } = body as { confirmed?: unknown, refused?: unknown }
  if (typeof confirmed !== 'boolean') return null
  return { confirmed, refused: refused === true }
}

export async function readConsent (challengeId: string): Promise<ConsentAnswer | null> {
  const { data } = await httpClientActions.post<unknown>('/server/aux/proxy', consentProxyRequest(challengeId))
  return consentAnswerOf(data)
}
