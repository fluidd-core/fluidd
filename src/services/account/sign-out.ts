/**
 * Signing out (KAN-532 §2.6): one way in, so the menu, the Account list and
 * the Devices page agree.
 *
 * Where the console serves Fluidd, "Sign out" opens `/sign-out`, which asks
 * "this browser" (the default) or "everywhere". The console's `/logout`
 * then ends the browser session and every session issued from it, and comes
 * back to `/`, which goes on to `/signed-out` (`signed-out-note.ts`).
 *
 * On a printer's own page there's only this page's session to end, so it
 * ends at once, and the signed-out page follows.
 */
import type VueRouter from 'vue-router'
import { cloudState, signOut } from '@/services/muon-cloud/state'
import { activationState } from '@/services/muon-cloud/activate'
import { centralLoginEnabled } from '@/services/muon-cloud/centralLogin'
import { accountApi } from './api'
import { isMissing } from './client'
import { noteSignedOut, type SignedOutScope } from './signed-out-note'

/**
 * "Sign out" from the menu, the Account list or this browser's row in
 * Devices: the sign-out page where the console serves Fluidd, else at once.
 */
export async function beginSignOut (router?: VueRouter): Promise<void> {
  if (router && centralLoginEnabled() && cloudState.account) {
    await router.push('/sign-out').catch(() => {})
    return
  }
  await signOutNow('browser', { router })
}

/**
 * Signs this browser out now, remembering why for the signed-out page.
 * Where the console serves Fluidd, its `/logout` takes the page away and
 * brings it back; on a printer's own page the page goes there itself.
 */
export async function signOutNow (scope: SignedOutScope, options: { password?: boolean, router?: VueRouter } = {}): Promise<void> {
  noteSignedOut({ scope, email: cloudState.account?.email, password: options.password || undefined })
  const wasCloud = cloudState.activePrinterId !== null || activationState.switching !== null
  const navigating = await signOut()
  if (navigating) return
  // A cloud printer that was open goes with the session: load afresh.
  if (wasCloud || !options.router) window.location.assign('/signed-out')
  else await options.router.push('/signed-out').catch(() => {})
}

/**
 * Ends every session of the account but this browser's, which the sign-out
 * that follows ends. An older console without `DELETE /v1/me/sessions`
 * has them ended one at a time: everything that isn't a browser first, as
 * ending a browser's session ends the ones issued from it, this page's
 * included, and the rest would then be refused.
 */
export async function endEverySession (): Promise<void> {
  try {
    await accountApi.endSessions('all')
    return
  } catch (error) {
    if (!isMissing(error)) throw error
  }
  const { sessions } = await accountApi.sessions()
  const others = sessions.filter(s => !s.current && s.id !== sessions.find(c => c.current)?.parent_id)
  others.sort((a, b) => Number(a.kind === 'browser') - Number(b.kind === 'browser'))
  for (const session of others) {
    await accountApi.endSession(session.id).catch(() => {})
  }
}
