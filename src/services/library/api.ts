/**
 * The model service's Library (KAN-521): the prints a person saves from the
 * slicer, kept in their Muon3D account and shown on every printer.
 *
 * Every request carries a signed assertion of the account (assertion.ts),
 * never the console session itself. A 401 drops the assertion and asks once
 * more with a new one. Refusals are the service's `{"error": {code,
 * message}}`, read into a LibraryError with that code.
 *
 * Files move by Transfer: a URL to PUT or GET. With a presigning store the
 * URL is the bucket's and carries no bearer; in development it is the
 * service's own route and `needs_auth` says to send the assertion.
 */

/** The model service, and the audience its assertions name (the same string). */
export const MODELS_URL: string = (import.meta.env.VITE_MODELS_URL || 'https://models.muon3d.com').replace(/\/+$/, '')
export const MODELS_AUDIENCE = MODELS_URL

export interface Transfer {
  method: string;
  url: string;
  needs_auth: boolean;
  expires_at: string;
}

/** What a G-code was sliced for. */
export interface PrintSetup {
  printer_model: string;
  nozzle_mm: number;
  material: string;
}

/** One of a print's G-codes, as the item lists them. */
export interface ItemSetup extends PrintSetup {
  print_seconds: number | null;
  filament_g: number | null;
  file_id: string;
}

export interface LibraryItem {
  id: string;
  kind: string;
  format: string;
  name: string;
  size_bytes: number;
  has_thumbnail: boolean;
  state: string;
  rev: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  versioned?: boolean;
  version?: number | null;
  versions?: number;
  summary?: Record<string, unknown> | null;
  setups?: ItemSetup[];
  project_file_id?: string | null;
  thumbnail_file_id?: string | null;
  printed_count?: number;
  last_printed_at?: string | null;
  last_printer_name?: string | null;
}

export type FileRole = 'project' | 'gcode' | 'thumbnail'

export interface FileDecl {
  role: FileRole;
  format: '3mf' | 'gcode' | 'png' | 'jpeg';
  encoding: 'identity' | 'gzip';
  size_bytes: number;
  sha256: string;
  name?: string;
  setup?: PrintSetup;
  print_seconds?: number;
  filament_g?: number;
}

export interface VersionFile extends FileDecl {
  id: string;
}

export interface Version {
  number: number;
  origin: string;
  state: string;
  created_at: string;
  summary: Record<string, unknown> | null;
  files: VersionFile[];
}

/** The live, immutable version exposed by `GET /v1/public/publications/:id`. */
export interface PublicPublication {
  title: string;
  version: number;
  files: VersionFile[];
}

export type SaveOrigin = 'save' | 'autosave' | 'card' | 'print-check'

export interface VersionBody {
  origin: SaveOrigin;
  summary: Record<string, unknown>;
  files: FileDecl[];
}

export interface Created {
  item: LibraryItem;
  version: Version;
  uploads: Array<{ sha256: string, upload: Transfer }>;
}

export interface Preferences {
  autosave: boolean;
  ask: boolean;
  save_from_print_check: boolean;
  updated_at: string | null;
}

export type PreferencesPatch = Partial<Pick<Preferences, 'autosave' | 'ask' | 'save_from_print_check'>>

export interface LibraryAccount {
  consent_version: string | null;
  consented_at: string | null;
  purge_after: string | null;
  quota_bytes: number;
}

/** `GET /v1/library`. */
export interface LibraryInfo {
  enabled: boolean;
  promise_version: string;
  account: LibraryAccount | null;
  used_bytes: number;
  quota_bytes: number;
}

/** One page of `GET /v1/items?since=`. */
export interface FeedPage {
  items: LibraryItem[];
  rev: number;
  reset: boolean;
  more: boolean;
}

export interface PrintedEvent {
  printer_name: string;
  setup?: PrintSetup;
  version?: number;
}

export interface LibrarySections {
  all: number;
  printed: number;
  sliced: number;
  uploads: number;
  saved: number;
  imported: number;
  designs: number;
}

export type LibraryRunOutcome = 'running' | 'finished' | 'cancelled' | 'failed' | 'unknown'

export interface LibraryRun {
  id: string;
  item_id: string | null;
  version: number | null;
  printer_id: string;
  printer_name: string;
  /** Absent when the run was reported by its hash alone. */
  file_name: string | null;
  started_at: string;
  ended_at: string | null;
  outcome: LibraryRunOutcome;
  progress_pct: number | null;
  duration_s: number | null;
  in_library: boolean;
  item?: LibraryItem | null;
}

/** `GET /v1/library/runs` answers `{runs, cursor}`: `cursor` is the last run's start, to pass back for the next page. */
export interface LibraryRunsPage {
  runs: LibraryRun[];
  cursor: string | null;
}

/** A person's bookmark as returned by `GET /v1/community/saves`. */
export interface CommunitySave {
  id: string;
  target: { kind: string } & Record<string, unknown>;
  card: {
    title: string;
    thumbnail_url?: string | null;
    creator?: string | null;
    url?: string | null;
    available: boolean;
  };
  created_at: string;
}

export interface CommunitySavesPage {
  saves: CommunitySave[];
  next_cursor: string | null;
}

/** The deliberately small display model for a community save. */
export interface SavedRow {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  creator: string | null;
  url: string | null;
  available: boolean;
}

export function savedRows (page: CommunitySavesPage): SavedRow[] {
  if (!Array.isArray(page.saves)) return []
  return page.saves.map(({ id, card }) => ({
    id,
    title: card.title,
    thumbnailUrl: card.thumbnail_url ?? null,
    creator: card.creator ?? null,
    url: card.url ?? null,
    available: card.available
  }))
}

/**
 * A refusal or a failure, by the service's stable code (`consent_required`,
 * `quota_exceeded`, `not_found`, …), or one of Fluidd's own: `not-signed-in`
 * (no account, or the service refused the assertion twice), `offline` (no
 * answer at all), `console` (the console would not give an assertion).
 */
export class LibraryError extends Error {
  constructor (readonly code: string, message: string, readonly status = 0) {
    super(message)
    this.name = 'LibraryError'
  }
}

export const notSignedIn = () => new LibraryError('not-signed-in', 'Sign in to Muon3D to use your Library.', 401)

/** The service's answer to a request that failed, as a LibraryError. */
export function libraryErrorFrom (status: number, body: unknown): LibraryError {
  if (status === 401) return notSignedIn()
  const error = (body as { error?: { code?: unknown, message?: unknown } } | null)?.error
  const code = typeof error?.code === 'string' && error.code ? error.code : `http-${status}`
  const message = typeof error?.message === 'string' && error.message ? error.message : `The Library answered ${status}.`
  return new LibraryError(code, message, status)
}

/** What a person reads when a Library request fails. */
export function describeLibraryError (error: unknown): string {
  if (!(error instanceof LibraryError)) return error instanceof Error ? error.message : String(error)
  switch (error.code) {
    case 'not-signed-in': return 'Sign in to Muon3D to use your Library.'
    case 'offline': return 'Your Library can\'t be reached. Check this computer\'s internet connection.'
    case 'consent_required': return 'Your Library is off. Turn it on in Settings › Library.'
    case 'quota_exceeded': return `Your Library is full. ${error.message}`
    case 'promise_changed': return 'The Library\'s promise has changed. Read the new one in Settings › Library, then turn it on again.'
    default: return error.message
  }
}

/** A PUT of a file's bytes; resolves to the HTTP status. */
export interface SendRequest {
  url: string;
  body: Uint8Array;
  headers: Record<string, string>;
  onProgress?: (sent: number) => void;
}

export type Send = (request: SendRequest) => Promise<number>

/** A PUT through XMLHttpRequest, which reports how much has gone (fetch can't). */
export const xhrSend: Send = (request) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest()
  xhr.open('PUT', request.url)
  for (const [name, value] of Object.entries(request.headers)) xhr.setRequestHeader(name, value)
  if (request.onProgress) {
    const report = request.onProgress
    xhr.upload.onprogress = (event) => report(event.loaded)
  }
  xhr.onload = () => resolve(xhr.status)
  xhr.onerror = () => reject(new LibraryError('offline', 'The upload failed on the network.'))
  xhr.onabort = () => reject(new LibraryError('cancelled', 'The upload was cancelled.'))
  xhr.send(request.body)
})

export interface AssertionProvider {
  get (): Promise<string>;
  drop (): void;
}

export interface LibraryClientOptions {
  baseUrl?: string;
  assertion: AssertionProvider;
  fetch?: typeof fetch;
  send?: Send;
}

export type LibraryClient = ReturnType<typeof createLibraryClient>

export function createLibraryClient (options: LibraryClientOptions) {
  const base = (options.baseUrl ?? MODELS_URL).replace(/\/+$/, '')
  const http: typeof fetch = options.fetch ?? ((input, init) => fetch(input, init))
  const send = options.send ?? xhrSend

  /** A request with the assertion; a 401 asks once more with a new one. */
  async function authorised (url: string, init: RequestInit, retried = false): Promise<Response> {
    const token = await options.assertion.get()
    let response: Response
    try {
      response = await http(url, { ...init, headers: { ...(init.headers as Record<string, string> | undefined), authorization: `Bearer ${token}` } })
    } catch {
      throw new LibraryError('offline', 'The Library could not be reached.')
    }
    if (response.status === 401 && !retried) {
      options.assertion.drop()
      return authorised(url, init, true)
    }
    return response
  }

  async function request<T> (method: string, path: string, body?: unknown): Promise<T> {
    const init: RequestInit = { method }
    if (body !== undefined) {
      init.headers = { 'content-type': 'application/json' }
      init.body = JSON.stringify(body)
    }
    const response = await authorised(`${base}${path}`, init)
    const text = await response.text()
    let data: unknown = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      if (response.ok) throw new LibraryError('protocol', 'The Library sent an unreadable answer.', response.status)
    }
    if (!response.ok) throw libraryErrorFrom(response.status, data)
    return data as T
  }

  const item = (id: string) => `/v1/items/${encodeURIComponent(id)}`

  return {
    base,
    info: () => request<LibraryInfo>('GET', '/v1/library'),
    consent: (promiseVersion: string) => request<LibraryAccount>('PUT', '/v1/library/consent', { promise_version: promiseVersion }),
    withdraw: () => request<{ enabled: boolean, account: LibraryAccount | null }>('DELETE', '/v1/library/consent'),
    preferences: () => request<Preferences>('GET', '/v1/library/preferences'),
    setPreferences: (patch: PreferencesPatch) => request<Preferences>('PUT', '/v1/library/preferences', patch),
    feed: (since: number) => request<FeedPage>('GET', `/v1/items?since=${since}`),
    sections: () => request<LibrarySections>('GET', '/v1/library/sections'),
    // An empty cursor is left out: the service reads a present-but-empty one as a malformed timestamp.
    runs: (cursor = '', limit = 50) => request<LibraryRunsPage>('GET', `/v1/library/runs?${cursor ? `cursor=${encodeURIComponent(cursor)}&` : ''}limit=${limit}`),
    sliced: () => request<FeedPage>('GET', '/v1/items?origin=slice'),
    saved: () => request<CommunitySavesPage>('GET', '/v1/community/saves'),
    createPrint: (body: VersionBody & { name: string }) => request<Created>('POST', '/v1/prints', body),
    createVersion: (id: string, body: VersionBody) => request<Created>('POST', `${item(id)}/versions`, body),
    complete: (id: string, version: number) =>
      request<{ item?: LibraryItem, version?: Version }>('POST', `${item(id)}/versions/${version}/complete`),
    item: (id: string) => request<LibraryItem>('GET', item(id)),
    versions: (id: string) => request<{ versions: Version[] }>('GET', `${item(id)}/versions`),
    publicPublication: (id: string) => request<PublicPublication>('GET', `/v1/public/publications/${encodeURIComponent(id)}`),
    /** The raw bytes of a shared file: `POST /v1/shares/:id/files/:file` takes `{key?}` and answers the bytes, or a JSON refusal. */
    async shareFile (id: string, fileId: string, key?: string): Promise<Uint8Array> {
      const response = await authorised(`${base}/v1/shares/${encodeURIComponent(id)}/files/${encodeURIComponent(fileId)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(key === undefined ? {} : { key })
      })
      if (!response.ok) {
        let data: unknown = null
        try { data = await response.json() } catch { /* nothing readable */ }
        throw libraryErrorFrom(response.status, data)
      }
      return new Uint8Array(await response.arrayBuffer())
    },
    restore: (id: string, version: number) => request<{ item: LibraryItem, version: Version }>('POST', `${item(id)}/versions/${version}/restore`),
    rename: (id: string, name: string) => request<LibraryItem>('PATCH', item(id), { name }),
    remove: (id: string) => request<LibraryItem>('DELETE', item(id)),
    copy: (id: string, name: string) => request<{ item: LibraryItem, version: Version }>('POST', `${item(id)}/copy`, { name }),
    fileUrl: (id: string, fileId: string) => request<Transfer>('GET', `${item(id)}/files/${encodeURIComponent(fileId)}/content-url`),
    thumbnailUrl: (id: string) => request<Transfer>('GET', `${item(id)}/thumbnail-url`),
    printed: (id: string, event: PrintedEvent) =>
      request<{ item: LibraryItem }>('POST', `${item(id)}/events`, { kind: 'printed', ...event }),

    /** PUTs a file where the Transfer says, with the assertion only when the URL is the service's own. */
    async put (transfer: Transfer, bytes: Uint8Array, onProgress?: (sent: number) => void): Promise<void> {
      const attempt = async (retried: boolean): Promise<void> => {
        const headers: Record<string, string> = {}
        if (transfer.needs_auth) headers.authorization = `Bearer ${await options.assertion.get()}`
        let status: number
        try {
          status = await send({ url: transfer.url, body: bytes, headers, onProgress })
        } catch (error) {
          if (error instanceof LibraryError) throw error
          throw new LibraryError('offline', 'The upload failed on the network.')
        }
        if (status === 401 && transfer.needs_auth && !retried) {
          options.assertion.drop()
          return attempt(true)
        }
        if (status < 200 || status >= 300) throw libraryErrorFrom(status, null)
      }
      return attempt(false)
    },

    /** GETs a file where the Transfer says, with the assertion only when the URL is the service's own. */
    async get (transfer: Transfer): Promise<Uint8Array> {
      let response: Response
      if (transfer.needs_auth) {
        response = await authorised(transfer.url, { method: 'GET' })
      } else {
        try {
          response = await http(transfer.url, { method: 'GET' })
        } catch {
          throw new LibraryError('offline', 'The file could not be fetched.')
        }
      }
      if (!response.ok) {
        let data: unknown = null
        try {
          data = await response.json()
        } catch { /* a bucket's XML, or nothing */ }
        throw libraryErrorFrom(response.status, data)
      }
      return new Uint8Array(await response.arrayBuffer())
    }
  }
}
