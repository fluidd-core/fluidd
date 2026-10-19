/**
 * Published September text stays paired with its original version.
 * Prepared October text is generated from models docs/promise.md into
 * profile-promise.ts. Select the service's exact known version (MSV-3).
 * Update the phone and public customer page to the same words before rollout.
 */
import { PROFILE_PROMISE, PROFILE_PROMISE_VERSION } from './profile-promise'

export const PROMISE_VERSION = '2026-09-26'

export const PROMISE_TITLE = 'Keep your models in your account'

export const PROMISE_LINES: readonly string[] = [
  'Muon3D stores the models you add to the Library, so they appear on each phone where you sign in.',
  'We store each file, its name, and where it came from.',
  'You can delete a model at any time, and we delete it at once.',
  'If you turn this off, we delete your stored models after 30 days.',
  'Your printer does not need this, and your models stay on this phone either way.'
]

export const PROMISE_URL = 'https://muon3d.com/privacy/model-services'

/** The promise in one paragraph, as the slicer's card shows it. */
export const PROMISE_SUMMARY = `${PROMISE_TITLE}. ${PROMISE_LINES.join(' ')}`

/** Select only text bundled with this client, never relabel another version. */
export function libraryPromise (version: string | null) {
  if (!version) return null
  const lines = version === PROFILE_PROMISE_VERSION
    ? PROFILE_PROMISE
    : version === PROMISE_VERSION ? PROMISE_LINES : null
  return lines ? { version, lines, summary: `${PROMISE_TITLE}. ${lines.join(' ')}`, url: PROMISE_URL } : null
}
