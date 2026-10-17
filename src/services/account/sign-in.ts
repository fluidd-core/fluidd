/**
 * Signing in on the console's own page (WEB-12, `views/SignIn.vue`) and from
 * the signed-out page: a password (and a two-step code), a passkey, or a new
 * account, each ending in the console's handoff to its browser session.
 *
 * The page's own session exists only to ask for the handoff, so it's ended
 * as soon as the handoff is in hand (KAN-532): before, it stayed for 30 days
 * as "Muon3D sign-in" in the person's devices, and signing out never ended
 * it. The handoff doesn't need it: the console keeps the account and when it
 * signed in, not the session. A console with muon-link-cloud #26 also ends
 * it when the code is spent; ending it here works on one without.
 */
import { handoffUrl, prepareAuthorize } from '@/services/muon-cloud/centralLogin'
import { accountRequest } from './client'
import { usePasskey } from './webauthn'
import type { AccountDetails } from './api'

/** How the console lists the page's session, for the moment it lives. */
export const SIGN_IN_DEVICE = 'Muon3D sign-in'

interface SessionAnswer {
  token: string;
  account?: AccountDetails;
}

/** A password sign-in: a session, or the two-step token to send a code with (`AccountError.mfaToken`). */
export async function passwordSignIn (email: string, password: string): Promise<string> {
  const answer = await accountRequest<SessionAnswer>('POST', '/v1/auth/sign-in', { email, password, device: SIGN_IN_DEVICE, refresh: false }, { token: null })
  return answer.token
}

/** The code that finishes a two-step sign-in: an authenticator code, or a recovery code. */
export async function codeSignIn (mfaToken: string, code: string): Promise<string> {
  const answer = await accountRequest<SessionAnswer>('POST', '/v1/auth/mfa', { mfa_token: mfaToken, code: code.replace(/\s+/g, '') }, { token: null })
  return answer.token
}

/** A passkey on this device (it skips the two-step code: a passkey is both factors). */
export async function passkeySignIn (): Promise<string> {
  const { ceremony_id: ceremony, options } = await accountRequest<{ ceremony_id: string, options: { publicKey: Record<string, unknown> } }>('POST', '/v1/auth/passkey/options', undefined, { token: null })
  const credential = await usePasskey(options.publicKey)
  const answer = await accountRequest<SessionAnswer>('POST', '/v1/auth/passkey', { ceremony_id: ceremony, credential, device: SIGN_IN_DEVICE, refresh: false }, { token: null })
  return answer.token
}

export async function signUp (email: string, password: string, name: string, declaredAge?: number): Promise<string> {
  const answer = await accountRequest<SessionAnswer>('POST', '/v1/auth/sign-up', { email, password, name, declared_age: declaredAge, device: SIGN_IN_DEVICE, refresh: false }, { token: null })
  return answer.token
}

/** Always answers the same, so nobody can learn whether an address has an account. */
export async function forgotPassword (email: string): Promise<void> {
  await accountRequest('POST', '/v1/auth/password/forgot', { email }, { token: null })
}

/** From the emailed link: the new password, and every device is signed out. */
export async function resetPassword (token: string, password: string): Promise<void> {
  await accountRequest('POST', '/v1/auth/password/reset', { token, password }, { token: null })
}

/** From the emailed link: confirms the address, or finishes changing it. */
export async function verifyEmail (token: string): Promise<string> {
  const answer = await accountRequest<{ ok: boolean, email?: string }>('POST', '/v1/auth/email/verify', { token }, { token: null })
  return answer.email ?? ''
}

/**
 * Turns the page's session into the console's browser session: asks for
 * the handoff, ends the page's session, and answers where to go: the
 * console's `/handoff`, which carries on to `next` (an `/authorize?...`),
 * or, with none, to an `/authorize` for this page that lands on `returnTo`.
 */
export async function finishSignIn (token: string, next: string | null, returnTo = '/'): Promise<string> {
  let carryOn = next
  if (!carryOn) {
    const url = new URL(await prepareAuthorize({ silent: false, returnTo }))
    carryOn = `${url.pathname}${url.search}`
  }
  const handoff = await accountRequest<{ code: string, url: string, expires_at: number }>('POST', '/v1/handoff', undefined, { token })
  await accountRequest('POST', '/v1/auth/sign-out', undefined, { token }).catch(() => {})
  return handoffUrl(handoff.url, carryOn)
}
