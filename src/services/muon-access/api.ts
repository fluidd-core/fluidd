/**
 * `server.muon.access.*` (Moonraker muon_access_api, AB-MR-2): who owns a
 * printer, who it lets in, and what this browser may do there (ADR 0037,
 * ACC-1 to ACC-34). The shapes follow Moonraker's
 * `tests/assets/muon_access_contract.json`, which the app's mock reads too.
 *
 * Two ways to ask: the printer Fluidd is showing, through Fluidd's own HTTP
 * client (so a cloud printer is asked over Iroh), or another printer on this
 * network by its address, for "Ask for access" from the printer list.
 *
 * A printer whose Moonraker predates muon_access answers 404. That is
 * `AccessUnavailable`, so a caller falls back to the old protection level.
 */
import Vue from 'vue'
import { lanFetch } from '@/services/muon-cloud/discovery'

export type AccessLevel = 'signed-out-guest' | 'signed-in-guest' | 'member' | 'admin'
export type AccessRole = 'operator' | 'viewer'
export type AccessEntry = 'open' | 'protected'
export type DataMode = 'shared' | 'accounts' | 'both'
export type LevelsPreset = 'relaxed' | 'standard' | 'strict'
export type Capability = 'allowed' | 'ask' | 'refused'
export type RequestStatus = 'pending' | 'allowed' | 'refused' | 'expired'

export interface AccessOwner {
  kind: 'none' | 'account' | 'organisation' | 'unknown';
  email?: string;
  name?: string;
}

export interface AccessState {
  owner: AccessOwner;
  entry: AccessEntry;
  you: { level: AccessLevel, role: AccessRole, trusted: boolean, principal: string };
  ways: Record<'email' | 'link' | 'password' | 'approve', { on: boolean }>;
  privateUploads: boolean;
  dataMode: DataMode;
  levelsPreset: LevelsPreset;
}

export type AccessAsk = { kind: 'entry', entry: AccessEntry } | { kind: 'join' }

export interface AccessRequest {
  requestId: string;
  /** What the printer's screen shows beside the question, so both sides can be compared. */
  code: string;
  expiresAt: number;
}

/** The printer has no `server.muon.access.*`: its MuonOS predates it. */
export class AccessUnavailable extends Error {
  constructor () {
    super("This printer's software does not have access settings yet.")
    this.name = 'AccessUnavailable'
  }
}

/** A refusal the printer explained, such as a request from away from home. */
export class AccessRefused extends Error {
  constructor (message: string, readonly status: number) {
    super(message)
    this.name = 'AccessRefused'
  }
}

type Send = (method: 'GET' | 'POST', path: string, body?: Record<string, unknown>) => Promise<unknown>

const PREFIX = '/server/muon/access'

function fail (status: number, message?: string): never {
  if (status === 404) throw new AccessUnavailable()
  throw new AccessRefused(message || `The printer refused (HTTP ${status}).`, status)
}

/** Through Fluidd's client: the printer on screen, over the LAN or Iroh. */
const viaFluidd: Send = async (method, path, body) => {
  try {
    const response = method === 'GET'
      ? await Vue.$httpClient.get(path, { params: body })
      : await Vue.$httpClient.post(path, body ?? {})
    return response.data?.result ?? response.data
  } catch (error) {
    const response = (error as { response?: { status: number, data?: any } }).response
    if (!response) throw error
    return fail(response.status, response.data?.error?.message)
  }
}

/** Straight to another printer on this network. */
function viaLan (apiUrl: string): Send {
  const base = apiUrl.replace(/\/+$/, '')
  return async (method, path, body) => {
    const query = method === 'GET' && body
      ? `?${new URLSearchParams(Object.entries(body).map(([k, v]) => [k, String(v)]))}`
      : ''
    const response = await lanFetch(`${base}${path}${query}`, method === 'GET'
      ? { cache: 'no-store' }
      : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) })
    const data = await response.json().catch(() => null)
    if (!response.ok) return fail(response.status, data?.error?.message)
    return data?.result ?? data
  }
}

export interface AccessClient {
  get (): Promise<AccessState>;
  capabilities (): Promise<Record<string, Capability>>;
  setEntry (entry: AccessEntry): Promise<boolean>;
  setPrivateUploads (enabled: boolean): Promise<boolean>;
  setData (mode: DataMode): Promise<boolean>;
  setLevels (preset: LevelsPreset): Promise<boolean>;
  request (ask: AccessAsk, label?: string): Promise<AccessRequest>;
  requestStatus (requestId: string): Promise<RequestStatus>;
  cancelRequest (requestId: string): Promise<void>;
}

function client (send: Send): AccessClient {
  /** The `set_*` methods answer `{applied}`: false when only the owner may change it. */
  const applied = async (path: string, body: Record<string, unknown>) =>
    ((await send('POST', `${PREFIX}/${path}`, body)) as { applied?: boolean })?.applied === true
  return {
    get: async () => (await send('GET', `${PREFIX}/get`)) as AccessState,
    capabilities: async () => ((await send('GET', `${PREFIX}/capabilities`)) as { actions: Record<string, Capability> }).actions ?? {},
    setEntry: entry => applied('set_entry', { entry }),
    setPrivateUploads: enabled => applied('set_private_uploads', { enabled }),
    setData: mode => applied('set_data', { mode }),
    setLevels: preset => applied('set_levels', { preset }),
    request: async (ask, label) => (await send('POST', `${PREFIX}/request`, label ? { ask, label } : { ask })) as AccessRequest,
    requestStatus: async requestId =>
      ((await send('GET', `${PREFIX}/request_status`, { request_id: requestId })) as { status: RequestStatus }).status,
    cancelRequest: async requestId => { await send('POST', `${PREFIX}/cancel_request`, { request_id: requestId }) }
  }
}

/** The printer Fluidd is showing. */
export const currentPrinterAccess = (): AccessClient => client(viaFluidd)

/** Another printer on this network, by its Moonraker address. */
export const lanPrinterAccess = (apiUrl: string): AccessClient => client(viaLan(apiUrl))

export const LEVEL_WORDS: Record<AccessLevel, string> = {
  'signed-out-guest': 'Guest',
  'signed-in-guest': 'Signed-in guest',
  member: 'Member',
  admin: 'Admin'
}

/**
 * The rows of the level table worth showing a person, in the order of the
 * design's section 3, with the words the app uses.
 */
export const CAPABILITY_ROWS: Array<{ action: string, label: string }> = [
  { action: 'read', label: 'See status and the camera' },
  { action: 'print', label: 'Print, pause and cancel' },
  { action: 'files', label: 'Upload and delete own files' },
  { action: 'motion', label: 'Move and run macros' },
  { action: 'heat', label: 'Heat the nozzle and bed' },
  { action: 'files_others', label: "Delete or reprint others' files" },
  { action: 'console', label: 'Use the console' },
  { action: 'wifi', label: 'Change Wi-Fi' },
  { action: 'hotspot', label: 'Turn the hotspot on or off' },
  { action: 'updates', label: 'Install updates' },
  { action: 'rename', label: 'Rename the printer' },
  { action: 'config', label: 'Edit the configuration' },
  { action: 'protection', label: 'Change who can use it' }
]

/** Motion's words on a printer whose Moonraker has no `heat` row, where motion covers heating too. */
const MOTION_WITH_HEAT = 'Move, heat and run macros'

/**
 * The rows this printer reports, in order, with what this browser may do.
 * Moonraker gave heating its own row (KAN-878); one from before that reports
 * no `heat`, so its motion row still says it heats.
 */
export function capabilityRows (capabilities: Record<string, Capability>): Array<{ action: string, label: string, value: Capability }> {
  const ownHeat = 'heat' in capabilities
  return CAPABILITY_ROWS
    .filter(row => row.action in capabilities)
    .map(row => ({
      ...row,
      label: row.action === 'motion' && !ownHeat ? MOTION_WITH_HEAT : row.label,
      value: capabilities[row.action]
    }))
}
