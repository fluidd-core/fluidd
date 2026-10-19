import { vi } from 'vitest'

/**
 * Moonraker's `/server/muon/dev_mode/request` with the Aux API behind it, as
 * MuonOS #378 and Moonraker's route answer (KAN-547): `{result: ...}` on
 * success, `{error: {code, message: "dev-mode:<code>: <why>"}}` with the
 * status on a refusal, and Moonraker's own bare 404 when the route is absent.
 *
 * `linked` and `asOwner` decide who may ask. Only the owner, or anyone on a
 * printer nobody owns, may open or complete a change, and completing needs a
 * confirmation on the printer's screen (`confirm()`).
 */
export const OWNER = 'jack@example.com'
export const CHALLENGE = 'Zb3s0VJpXkq2c1yN8dRtLw4mPa7oQe6F'
export const WAIVER = { version: 'w-1', text: "The printer's waiver" }

export function moonrakerError (status: number, message: string) {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data: { error: { code: status, message } } }
  })
}

export class FakePrinter {
  linked: boolean | null = true
  asOwner = true
  devMode = false
  routeMissing = false
  confirmed = false
  refused = false
  waiver: typeof WAIVER | null = WAIVER
  /** The waiver version the printer would accept at redeem. */
  currentWaiver = WAIVER.version
  opened: Array<{ enabled: boolean }> = []
  completed: Array<Record<string, unknown>> = []
  polled: string[] = []

  readonly get = vi.fn(async (path: string, options?: { params?: Record<string, unknown> }) => this.answer('GET', path, options?.params ?? {}))
  readonly post = vi.fn(async (path: string, body?: Record<string, unknown>) => this.answer('POST', path, body ?? {}))

  confirm () {
    this.confirmed = true
  }

  private get mayAsk (): boolean {
    return this.asOwner || this.linked === false
  }

  private refuse (): never {
    if (this.linked === null) {
      throw moonrakerError(403, 'dev-mode:owner_unknown: The printer cannot tell right now whether an account owns it, so only its owner can change developer mode. Try again in a minute.')
    }
    throw moonrakerError(403, `dev-mode:owner_required: Only ${OWNER} can change developer mode on this printer. Ask from control.muon3d.com or the Muon app, then confirm it on the printer.`)
  }

  private async answer (method: 'GET' | 'POST', path: string, args: Record<string, unknown>) {
    if (path !== '/server/muon/dev_mode/request' || this.routeMissing) {
      throw Object.assign(new Error('Request failed with status code 404'), {
        response: { status: 404, data: { error: { code: 404, message: 'Not Found' } } }
      })
    }
    if (method === 'GET' && !('challenge_id' in args)) {
      return {
        data: {
          result: {
            as_owner: this.asOwner,
            owner: { linked: this.linked, account: this.linked ? OWNER : null },
            may_ask: this.mayAsk,
            waiver: this.waiver
          }
        }
      }
    }
    if (method === 'GET') {
      this.polled.push(String(args.challenge_id))
      if (args.challenge_id !== CHALLENGE) throw moonrakerError(404, 'dev-mode:challenge_not_found: No such challenge.')
      return { data: { result: { challenge_id: CHALLENGE, confirmed: this.confirmed, refused: this.refused, expires_at: 1, enabled: !this.devMode } } }
    }
    if (typeof args.enabled !== 'boolean') throw moonrakerError(400, "'enabled' is required")
    if (!this.mayAsk) this.refuse()
    if (!('challenge_id' in args)) {
      if (args.enabled === this.devMode) {
        throw moonrakerError(409, `dev-mode:no_change: Developer mode is already ${this.devMode ? 'on' : 'off'}.`)
      }
      this.opened.push({ enabled: args.enabled })
      return {
        data: {
          result: {
            challenge_id: CHALLENGE,
            expires_at: 1,
            expires_in_seconds: 120,
            instruction: args.enabled ? 'Press the knob on the printer to confirm.' : 'Press the knob on the printer to turn Developer Mode off.',
            enabled: args.enabled,
            as_owner: this.asOwner,
            ...(args.enabled ? { waiver: this.waiver } : {})
          }
        }
      }
    }
    this.completed.push(args)
    if (!this.confirmed) {
      throw moonrakerError(428, "dev-mode:confirmation_required: Confirm this on the printer's panel first.")
    }
    if (args.enabled && args.waiver_version !== this.currentWaiver) {
      throw moonrakerError(409, 'dev-mode:waiver_out_of_date: The waiver shown is not the current one. Show the current waiver and ask again.')
    }
    this.devMode = args.enabled
    return { data: { result: { enabled: this.devMode, released: true } } }
  }
}
