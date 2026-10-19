import Vue from 'vue'

/**
 * A developer-mode change, asked for through Moonraker's one route for it,
 * `/server/muon/dev_mode/request` (KAN-547).
 *
 * Jack's rule: every change, on and off, is confirmed on the printer's
 * screen. A printer nobody owns takes a request from anyone; a linked
 * printer only from its owning account, which is one of the owner's own
 * devices (the phone app, or a browser enrolled as theirs), from anywhere.
 * The printer decides: its Aux API refuses everyone else and names the
 * account. Moonraker's route is what tells it a request is the owner's, and
 * it is the only route a remote session may use: muon-link keeps
 * `/server/aux/` closed to every one of them.
 *
 * Four calls, one route:
 *  - `GET` with nothing: who may ask, and the waiver turning on agrees to;
 *  - `POST {enabled}`: put the question on the printer's screen;
 *  - `GET {challenge_id}`: has the person there answered;
 *  - `POST {enabled, challenge_id, ...}`: make the change, once confirmed.
 *
 * Moonraker answers a refusal as `dev-mode:<code>: <why>`, so the code is
 * read here and the words are the printer's own.
 */

export const DEV_MODE_REQUEST_PATH = '/server/muon/dev_mode/request'

export interface DevModeWaiver {
  version: string;
  text: string;
}

export interface DevModeOwner {
  /** null when the printer can't tell. */
  linked: boolean | null;
  account: string | null;
}

export interface DevModeAsking {
  /** This connection counts as the printer's owner. */
  asOwner: boolean;
  owner: DevModeOwner;
  /** The owner, or anyone while nobody owns the printer. */
  mayAsk: boolean;
  waiver: DevModeWaiver | null;
}

export interface DevModeChallenge {
  challengeId: string;
  enabled: boolean;
  expiresInSeconds: number;
  instruction: string;
  waiver: DevModeWaiver | null;
}

export interface DevModeAnswer {
  confirmed: boolean;
  refused: boolean;
}

export interface DevModeCompletion {
  enabled: boolean;
  challengeId: string;
  waiverVersion?: string;
}

/** A refusal the printer explained, with its code (owner_required, no_change, ...). */
export class DevModeRefused extends Error {
  constructor (readonly code: string, message: string, readonly status: number) {
    super(message)
    this.name = 'DevModeRefused'
  }
}

/** The printer has no request route: its software predates KAN-547. */
export class DevModeRequestUnavailable extends Error {
  readonly status = 404

  constructor () {
    super("This printer's software can't take a developer-mode request. Update it, then try again.")
    this.name = 'DevModeRequestUnavailable'
  }
}

/** A challenge id as the Aux API makes them. Anything else is never sent. */
const CHALLENGE_ID = /^[A-Za-z0-9_-]{16,128}$/
const REFUSAL = /^dev-mode:([a-z_]+):\s*([\s\S]*)$/

function messageOf (data: unknown): string | undefined {
  if (typeof data === 'string') return data
  const message = (data as { error?: { message?: unknown } } | null)?.error?.message
  return typeof message === 'string' ? message : undefined
}

/** What a failed call means, as an error a person can be shown. */
export function refusalOf (error: unknown): Error {
  const response = (error as { response?: { status: number, data?: unknown } } | null)?.response
  if (!response) return error instanceof Error ? error : new Error(String(error))
  const message = messageOf(response.data)
  const match = message ? REFUSAL.exec(message) : null
  if (match) return new DevModeRefused(match[1], match[2].trim(), response.status)
  // Moonraker's own 404: no such route on this printer.
  if (response.status === 404) return new DevModeRequestUnavailable()
  return new DevModeRefused('refused', message || `The printer refused (HTTP ${response.status}).`, response.status)
}

function unwrap (data: unknown): Record<string, unknown> {
  const body = data && typeof data === 'object' && 'result' in data ? (data as { result: unknown }).result : data
  if (!body || typeof body !== 'object') throw new Error('the printer gave no answer')
  return body as Record<string, unknown>
}

function waiverOf (value: unknown): DevModeWaiver | null {
  const { version, text } = (value ?? {}) as { version?: unknown, text?: unknown }
  return typeof version === 'string' && version && typeof text === 'string' && text ? { version, text } : null
}

async function send (method: 'GET' | 'POST', body?: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const response = method === 'GET'
      ? await Vue.$httpClient.get(DEV_MODE_REQUEST_PATH, { params: body })
      : await Vue.$httpClient.post(DEV_MODE_REQUEST_PATH, body ?? {})
    return unwrap(response.data)
  } catch (error) {
    throw refusalOf(error)
  }
}

function checkedId (challengeId: string): string {
  if (!CHALLENGE_ID.test(challengeId)) throw new Error('not a challenge id')
  return challengeId
}

/** Who may ask on this printer, and what turning on agrees to. Asks nothing of its screen. */
export async function whoMayAsk (): Promise<DevModeAsking> {
  const body = await send('GET')
  const owner = (body.owner ?? {}) as { linked?: unknown, account?: unknown }
  return {
    asOwner: body.as_owner === true,
    owner: {
      linked: typeof owner.linked === 'boolean' ? owner.linked : null,
      account: typeof owner.account === 'string' && owner.account ? owner.account : null
    },
    mayAsk: body.may_ask === true,
    waiver: waiverOf(body.waiver)
  }
}

/** Puts the question on the printer's screen. */
export async function askToChange (enabled: boolean): Promise<DevModeChallenge> {
  const body = await send('POST', { enabled })
  if (typeof body.challenge_id !== 'string') throw new Error('the printer opened no request')
  return {
    challengeId: checkedId(body.challenge_id),
    enabled: typeof body.enabled === 'boolean' ? body.enabled : enabled,
    expiresInSeconds: typeof body.expires_in_seconds === 'number' ? body.expires_in_seconds : 0,
    instruction: typeof body.instruction === 'string' ? body.instruction : '',
    waiver: waiverOf(body.waiver)
  }
}

/** Whether the person at the printer has answered. */
export async function readAnswer (challengeId: string): Promise<DevModeAnswer> {
  const body = await send('GET', { challenge_id: checkedId(challengeId) })
  if (typeof body.confirmed !== 'boolean') throw new Error('the printer gave no answer')
  return { confirmed: body.confirmed, refused: body.refused === true }
}

/** Makes the confirmed change. Turning on acknowledges the waiver shown. */
export async function completeChange (change: DevModeCompletion): Promise<{ enabled: boolean }> {
  const body: Record<string, unknown> = { enabled: change.enabled, challenge_id: checkedId(change.challengeId) }
  if (change.enabled) {
    body.waiver_acknowledged = true
    body.waiver_version = change.waiverVersion
  }
  const answer = await send('POST', body)
  return { enabled: answer.enabled === true }
}

/** What to tell someone who may not ask, or null when they may. */
export function whyNot (asking: DevModeAsking | null): string | null {
  if (asking === null || asking.mayAsk) return null
  if (asking.owner.linked === null) {
    return "The printer can't tell yet whether an account owns it, so only its owner can change developer mode. Try again in a minute."
  }
  const who = asking.owner.account ?? "the printer's owner"
  return `Only ${who} can change developer mode on this printer, from one of their own devices. Each change is confirmed on the printer's screen.`
}
