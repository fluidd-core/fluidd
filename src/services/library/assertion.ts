/**
 * The assertion the model service takes in place of the console session
 * (the console's `POST /v1/me/assertion`): one account, one audience, a few
 * minutes. The console allows 60 a session in 10 minutes, so one is kept and
 * shared until a minute before it expires, and only one is asked for at a
 * time. It belongs to the console session it was asked with: a new sign-in
 * (or a refreshed session token) asks again.
 */
import { CloudError, cloudApi, storedToken } from '@/services/muon-cloud/api'
import { LibraryError, MODELS_AUDIENCE, notSignedIn, type AssertionProvider } from './api'

/** How long before its expiry an assertion is replaced. */
export const REFRESH_BEFORE_MS = 60_000

export interface AssertionAnswer {
  assertion: string;
  /** Seconds since the epoch. */
  expires_at: number;
}

export interface AssertionCacheOptions {
  /** Asks the console for a new one. */
  fetch: () => Promise<AssertionAnswer>;
  /** The console session now, or null when signed out. */
  session: () => string | null;
  now?: () => number;
}

export function createAssertionCache (options: AssertionCacheOptions): AssertionProvider {
  const now = options.now ?? Date.now
  let kept: { session: string, assertion: string, expiresAt: number } | null = null
  let asking: { session: string, promise: Promise<string> } | null = null

  return {
    get () {
      const session = options.session()
      if (!session) {
        kept = null
        return Promise.reject(notSignedIn())
      }
      if (kept && kept.session === session && now() < kept.expiresAt - REFRESH_BEFORE_MS) return Promise.resolve(kept.assertion)
      if (asking && asking.session === session) return asking.promise
      const mine = {
        session,
        promise: options.fetch().then((answer) => {
          if (typeof answer?.assertion !== 'string' || !answer.assertion || typeof answer.expires_at !== 'number') {
            throw new LibraryError('console', 'The Muon3D service sent no assertion.')
          }
          kept = { session, assertion: answer.assertion, expiresAt: answer.expires_at * 1000 }
          return answer.assertion
        }).finally(() => {
          if (asking === mine) asking = null
        })
      }
      asking = mine
      return mine.promise
    },
    drop () {
      kept = null
    }
  }
}

/** The console's refusal as the Library's: a session that has ended is `not-signed-in`. */
export async function consoleAssertion (audience: string = MODELS_AUDIENCE): Promise<AssertionAnswer> {
  try {
    return await cloudApi.assertion(audience)
  } catch (error) {
    if (error instanceof CloudError) {
      if (error.status === 401) throw notSignedIn()
      if (error.status === 0) throw new LibraryError('offline', 'The Muon3D service could not be reached.')
      throw new LibraryError('console', error.message, error.status)
    }
    throw error
  }
}

/** The model service's assertions, for this browser's Muon3D session. */
export const modelsAssertion = createAssertionCache({
  fetch: () => consoleAssertion(),
  session: storedToken
})
