// An in-memory model service for the Library's specs: the routes Fluidd uses, kept to the contract (KAN-521 §1),
// with every request recorded. Files are content-addressed per account: a POST asks to upload only the hashes the
// account doesn't hold yet. `presign` hands out bucket-like URLs that need no bearer; without it the transfers are
// the service's own and need the assertion.
//
// For the bridge's vectors (host.json's "library"): `quotaBytes` refuses a version whose declared bytes don't fit
// beside what the completed versions declared (the vectors count every save's bytes), new prints are item-1, item-2,
// …, `writes` lists each save and preferences change as the vectors name them, and `onUpload` runs while a file is
// being sent.
import { createLibraryClient, type FileDecl, type LibraryItem, type SendRequest, type Version } from '../api'

export interface Call {
  method: string;
  path: string;
  auth: string | null;
  body: unknown;
}

const BASE = 'https://models.example'

type Kept = LibraryItem & { _versions: Version[] }

export interface FakeServiceOptions {
  presign?: boolean;
  enabled?: boolean;
  assertion?: () => string;
  quotaBytes?: number | null;
}

export function fakeService (options: FakeServiceOptions = {}) {
  const calls: Call[] = []
  const writes: string[] = []
  const held = new Set<string>()
  const stored = new Map<string, Uint8Array>()
  const items = new Map<string, Kept>()
  const tombstones: LibraryItem[] = []
  const events: Array<Record<string, unknown>> = []
  const preferences = { autosave: false, ask: true, save_from_print_check: true, updated_at: null as string | null }
  let enabled = options.enabled ?? true
  let rev = 0
  let nextId = 1
  let used = 0
  let onUpload: (() => void) | null = null
  /** Answers queued for the next requests to a path, before the service's own: `{status, body}`. */
  const queued: Array<{ path: RegExp, status: number, body: unknown }> = []
  const tokens: string[] = []
  let tokenCount = 0

  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
  const refuse = (status: number, code: string, message: string) => json(status, { error: { code, message } })

  const transfer = (method: string, sha: string) => options.presign
    ? { method, url: `https://bucket.example/${sha}?sig=1`, needs_auth: false, expires_at: '2030-01-01T00:00:00Z' }
    : { method, url: `${BASE}/v1/files/${sha}/content`, needs_auth: true, expires_at: '2030-01-01T00:00:00Z' }

  const view = (i: Kept): LibraryItem => {
    const { _versions, ...rest } = i
    const current = _versions.find(v => v.number === i.version)
    const files = current?.files ?? []
    return {
      ...rest,
      versions: _versions.filter(v => v.state === 'ready').length,
      project_file_id: files.find(f => f.role === 'project')?.id ?? null,
      thumbnail_file_id: files.find(f => f.role === 'thumbnail')?.id ?? null,
      setups: files.filter(f => f.role === 'gcode').map(f => ({
        printer_model: f.setup!.printer_model,
        nozzle_mm: f.setup!.nozzle_mm,
        material: f.setup!.material,
        print_seconds: f.print_seconds ?? null,
        filament_g: f.filament_g ?? null,
        file_id: f.id
      }))
    }
  }

  const fileById = (item: Kept, id: string) => item._versions.filter(v => v.state === 'ready').flatMap(v => v.files).find(f => f.id === id)

  const newVersion = (item: Kept, body: { origin: string, summary: Record<string, unknown>, files: FileDecl[] }): Response | null => {
    const declared = body.files.reduce((sum, f) => sum + f.size_bytes, 0)
    if (options.quotaBytes != null && used + declared > options.quotaBytes) {
      return refuse(413, 'quota_exceeded', `${used} of ${options.quotaBytes} bytes used.`)
    }
    const version: Version = {
      number: item._versions.length + 1,
      origin: body.origin,
      state: 'pending',
      created_at: '2026-10-12T10:00:00Z',
      summary: body.summary,
      files: body.files.map((f, i) => ({ ...f, id: `${f.sha256.slice(0, 8)}-${item._versions.length + 1}-${i}` }))
    }
    item._versions.push(version)
    const uploads = [...new Set(body.files.map(f => f.sha256))].filter(sha => !held.has(sha)).map(sha => ({ sha256: sha, upload: transfer('PUT', sha) }))
    return json(201, { item: view(item), version, uploads })
  }

  async function handle (method: string, url: URL, auth: string | null, body: unknown): Promise<Response> {
    const path = url.pathname
    if (url.host === 'bucket.example') {
      // A presigned GET: the bucket answers it, with no bearer.
      const data = method === 'GET' ? stored.get(path.slice(1)) : undefined
      return data ? new Response(data, { status: 200 }) : new Response('<Error><Code>NoSuchKey</Code></Error>', { status: 404 })
    }
    const waiting = queued.findIndex(q => q.path.test(path))
    if (waiting >= 0) {
      const [q] = queued.splice(waiting, 1)
      return json(q.status, q.body)
    }
    if (options.assertion && auth !== `Bearer ${options.assertion()}`) return refuse(401, 'unauthorized', 'Bad assertion.')
    if (path === '/v1/library' && method === 'GET') {
      return json(200, { enabled, promise_version: '2026-09-26', account: enabled ? { purge_after: null, quota_bytes: 1e9 } : null, used_bytes: 1234, quota_bytes: 1e9 })
    }
    if (path === '/v1/library/consent' && method === 'PUT') {
      enabled = true
      return json(200, { consent_version: (body as { promise_version: string }).promise_version, quota_bytes: 1e9 })
    }
    if (path === '/v1/library/preferences') {
      if (method === 'PUT') {
        const patch = body as Record<string, boolean>
        Object.assign(preferences, patch)
        writes.push(`library.preferences ${Object.entries(patch).map(([k, v]) => `${k}=${v}`).join(' ')}`)
      }
      return json(200, preferences)
    }
    if (!enabled) return refuse(403, 'consent_required', 'The model service is off for this account.')
    if (path === '/v1/prints' && method === 'POST') {
      const b = body as { name: string, origin: string, summary: Record<string, unknown>, files: FileDecl[] }
      const id = `item-${nextId}`
      const item = { id, kind: 'plate', format: '3mf', name: b.name, size_bytes: 0, has_thumbnail: false, state: 'pending', rev: ++rev, created_at: '', updated_at: '', deleted_at: null, versioned: true, version: null, _versions: [] } as Kept
      const answer = newVersion(item, b)
      if (answer?.status === 201) {
        nextId++
        items.set(id, item)
        writes.push(`library.save ${b.name} ${b.origin} new`)
      }
      return answer!
    }
    let m = path.match(/^\/v1\/items\/([^/]+)$/)
    if (m && method === 'GET') {
      const item = items.get(m[1])
      return item && item.state !== 'pending' ? json(200, view(item)) : refuse(404, 'not_found', 'No such item.')
    }
    m = path.match(/^\/v1\/items\/([^/]+)\/versions$/)
    if (m && method === 'POST') {
      const item = items.get(m[1])
      if (!item) return refuse(404, 'not_found', 'No such item.')
      const b = body as { origin: string, summary: Record<string, unknown>, files: FileDecl[] }
      const answer = newVersion(item, b)
      if (answer?.status === 201) writes.push(`library.save ${item.name} ${b.origin} ${item.id}`)
      return answer!
    }
    if (m && method === 'GET') {
      const item = items.get(m[1])
      if (!item) return refuse(404, 'not_found', 'No such item.')
      return json(200, { versions: [...item._versions].reverse().filter(v => v.state === 'ready') })
    }
    m = path.match(/^\/v1\/items\/([^/]+)\/versions\/(\d+)\/complete$/)
    if (m && method === 'POST') {
      const item = items.get(m[1])
      const version = item?._versions.find(v => v.number === Number(m![2]))
      if (!item || !version) return refuse(404, 'not_found', 'No such item.')
      const missing = version.files.find(f => !held.has(f.sha256))
      if (missing) return refuse(422, 'size_mismatch', 'A file is missing.')
      version.state = 'ready'
      used += version.files.reduce((sum, f) => sum + f.size_bytes, 0)
      Object.assign(item, { state: 'ready', version: version.number, rev: ++rev })
      return json(200, { item: view(item), version })
    }
    m = path.match(/^\/v1\/items\/([^/]+)\/files\/([^/]+)\/content-url$/)
    if (m && method === 'GET') {
      const item = items.get(m[1])
      const file = item && fileById(item, m[2])
      return file ? json(200, transfer('GET', file.sha256)) : refuse(404, 'not_found', 'No such file.')
    }
    m = path.match(/^\/v1\/items\/([^/]+)\/events$/)
    if (m && method === 'POST') {
      const item = items.get(m[1])
      if (!item) return refuse(404, 'not_found', 'No such item.')
      const event = body as Record<string, unknown>
      events.push({ item: item.id, ...event })
      Object.assign(item, { printed_count: (item.printed_count ?? 0) + 1, last_printer_name: event.printer_name, rev: ++rev })
      return json(200, { item: view(item) })
    }
    m = path.match(/^\/v1\/files\/([0-9a-f]{64})\/content$/)
    if (m && method === 'GET') {
      const data = stored.get(m[1])
      return data ? new Response(data, { status: 200 }) : refuse(404, 'not_found', 'No such file.')
    }
    if (path === '/v1/items' && method === 'GET') {
      const since = Number(url.searchParams.get('since') ?? 0)
      const changed = [...items.values()].filter(i => i.rev > since && i.state !== 'pending').map(view)
      return json(200, { items: [...changed, ...tombstones.filter(t => t.rev > since)], rev, reset: false, more: false })
    }
    return refuse(404, 'not_found', `No route ${method} ${path}`)
  }

  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input))
    const headers = (init?.headers ?? {}) as Record<string, string>
    const auth = headers.authorization ?? null
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
    const method = init?.method ?? 'GET'
    calls.push({ method, path: url.pathname + url.search, auth, body })
    return handle(method, url, auth, body)
  }) as typeof fetch

  const send = async (request: SendRequest): Promise<number> => {
    const url = new URL(request.url)
    calls.push({ method: 'PUT', path: url.host === 'bucket.example' ? `bucket:${url.pathname}` : url.pathname, auth: request.headers.authorization ?? null, body: request.body.byteLength })
    const sha = url.pathname.match(/[0-9a-f]{64}/)?.[0]
    if (!sha) return 404
    if (!options.presign && options.assertion && request.headers.authorization !== `Bearer ${options.assertion()}`) return 401
    request.onProgress?.(Math.floor(request.body.byteLength / 2))
    onUpload?.()
    request.onProgress?.(request.body.byteLength)
    held.add(sha)
    stored.set(sha, request.body)
    return 200
  }

  const assertion = {
    get: async () => {
      const token = options.assertion?.() ?? `assertion-${++tokenCount}`
      tokens.push(token)
      return token
    },
    drop: () => {}
  }

  return {
    calls,
    writes,
    held,
    stored,
    items,
    tokens,
    tombstones,
    events,
    queue: (path: RegExp, status: number, body: unknown) => queued.push({ path, status, body }),
    setEnabled: (on: boolean) => { enabled = on },
    /** Runs `during` while the next files are being sent; null stops it. */
    whileUploading: (during: (() => void) | null) => { onUpload = during },
    fetch: fetchImpl,
    send,
    client: (assert = assertion) => createLibraryClient({ baseUrl: BASE, assertion: assert, fetch: fetchImpl, send })
  }
}
