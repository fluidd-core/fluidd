/**
 * @vitest-environment node
 */
// printer-bridge/1's conformance vectors (vendor/printer-client/bridge/vectors,
// the package's normative cases) against Fluidd's host:
//
// - messages.json against the validators the host reads requests with;
// - handshake.json's host cases against startSlicerHost (Fluidd's wiring:
//   the frame's window, the src's origin);
// - host.json's scenarios against the host helper with Fluidd's own adapter
//   (adapter.ts), talking to an in-memory Moonraker the way Fluidd's
//   $httpClient does (moonraker.ts), its requests sent over a real
//   MessageChannel by a port that keeps no client rules of its own.
//
// The scenarios cover the printer keys (an op for a printer the host has not
// selected, a switch mid-upload, a switch between the upload and
// print.request), the upload set (another frame's or printer's file, after 30
// minutes, a reload), the host's dialog (Print, Upload only, ✕, the tick,
// a cancel while it is open), queue entries, print.cancel of a foreign job,
// and injected names (a.gcode&print=true, ../config/x.cfg).
import { describe, expect, it } from 'vitest'
import handshake from '../vendor/printer-client/bridge/vectors/handshake.json'
import hostCases from '../vendor/printer-client/bridge/vectors/host.json'
import messages from '../vendor/printer-client/bridge/vectors/messages.json'
import { createBridgeHost, type ConfirmAnswer, type HostLogEntry } from '../vendor/printer-client/bridge/host'
import { parseClientEvent, parseIncoming, parsePrintDecision, parseQueueAnswer, parseRequest, type BridgePrinter, type PrintMode, type Welcome } from '../vendor/printer-client/bridge/protocol'
import { createFluiddAdapter } from '../adapter'
import { startSlicerHost } from '../host'
import { fakeMoonraker, newPrinter, type MoonrakerPrinter } from './moonraker'

const KEYS: Record<string, string> = messages.keys

/** The vectors' placeholders: "$walnut", "$oak", "$nonce" and {"$bytes": n}. */
function subst (value: unknown): unknown {
  if (typeof value === 'string') {
    if (value === '$nonce') return handshake.nonce
    if (value.startsWith('$') && KEYS[value.slice(1)]) return KEYS[value.slice(1)]
    return value
  }
  if (Array.isArray(value)) return value.map(subst)
  if (value && typeof value === 'object') {
    const r = value as Record<string, unknown>
    if (typeof r.$bytes === 'number') return new ArrayBuffer(r.$bytes)
    return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, subst(v)]))
  }
  return value
}

/** Every field of `partial` equals the same field of `actual` (deeply). */
function expectPartial (actual: unknown, partial: Record<string, unknown>, what: string) {
  for (const [k, v] of Object.entries(partial)) expect((actual as Record<string, unknown>)?.[k], `${what}: ${k}`).toEqual(v)
}

/** A window that records its listeners, for dispatching messages by hand. */
function fakeWindow () {
  const listeners = new Set<(e: MessageEvent) => void>()
  return {
    addEventListener: (_t: string, l: any) => { listeners.add(l) },
    removeEventListener: (_t: string, l: any) => { listeners.delete(l) },
    dispatch: (e: Partial<MessageEvent>) => {
      for (const l of [...listeners]) l(e as MessageEvent)
    }
  }
}

describe('vectors: messages, as the host reads them', () => {
  for (const c of messages.requests as any[]) {
    it(`request: ${c.name}`, () => {
      const parsed = parseRequest(subst(c.message))
      if (c.expect === 'ignored') return expect(parsed).toBeNull()
      expect(parsed).toBeTruthy()
      if (!parsed) return
      if (c.expect.error) {
        expect(parsed.ok).toBe(false)
        if (!parsed.ok) {
          expect(parsed.error.kind).toBe(c.expect.error)
          expect(parsed.id).toBe(c.expect.re)
        }
        return
      }
      expect(parsed.ok, JSON.stringify(parsed)).toBe(true)
      if (!parsed.ok) return
      const request = parsed.request as Record<string, unknown>
      const flat = { ...request, ...(typeof request.params === 'object' ? request.params as object : {}) }
      expectPartial(flat, subst(c.expect) as Record<string, unknown>, c.name)
    })
  }
  for (const c of messages.incoming as any[]) {
    it(`incoming: ${c.name}`, () => {
      const parsed = parseIncoming(subst(c.message))
      if (c.expect === 'ignored') return expect(parsed).toBeNull()
      expect(parsed).toBeTruthy()
      const { error, ...rest } = subst(c.expect) as Record<string, unknown>
      expectPartial(parsed, rest, c.name)
      if (error) expect(parsed?.kind === 'failure' && parsed.error.kind).toBe(error)
    })
  }
  // The client's own events (0.3.0: printer.material), as the host reads them.
  for (const c of messages.clientEvents as any[]) {
    it(`client event: ${c.name}`, () => {
      const parsed = parseClientEvent(subst(c.message))
      if (c.expect === 'ignored') return expect(parsed).toBeNull()
      expect(parsed, c.name).toEqual(subst(c.expect))
    })
  }
  for (const c of messages.answers as any[]) {
    it(`answer: ${c.name}`, () => {
      const read = c.op === 'queue.add' ? parseQueueAnswer(c.result) : parsePrintDecision(c.result, c.paths as string[], c.mode as PrintMode)
      if (c.expect === 'refused') return expect(read).toBeNull()
      expect(read).toEqual(c.expect)
    })
  }
})

describe('vectors: the handshake, against Fluidd\'s host', () => {
  for (const c of handshake.host as any[]) {
    it(c.name, () => {
      const welcomes: Welcome[] = []
      const contentWindow = {
        postMessage: (m: Welcome, origin: string) => {
          expect(origin).toBe('https://slicer.example')
          welcomes.push(m)
        }
      }
      const frame = { contentWindow, src: '' } as unknown as HTMLIFrameElement
      const win = fakeWindow()
      const host = startSlicerHost({
        frame,
        slicerUrl: new URL('https://slicer.example/embed.html'),
        store: { state: { printer: { printer: {} }, socket: {} }, getters: {}, subscribeAction: () => () => {} } as any,
        http: { get: async () => { throw new Error('no reads') }, post: async () => { throw new Error('no writes') } },
        selection: () => ({ switching: false, cloud: null, apiUrl: '', displayName: '', connected: false }),
        remote: () => false,
        fetchIdentity: async () => ({}),
        confirm: async () => ({ choice: 'upload-only' }),
        theme: 'light',
        hostVersion: 'test',
        target: win as any
      })
      // The listener was in place before the frame's src was set.
      expect(frame.src).toBe('https://slicer.example/embed.html')
      for (const h of c.hellos) win.dispatch({ source: (h.source === 'frame' ? contentWindow : {}) as any, origin: h.origin, data: h.data })
      expect(welcomes).toHaveLength(c.expect.welcomes)
      expect(welcomes.map(w => w.nonce)).toEqual(c.expect.nonces)
      if (c.expect.version) expect(welcomes[0].version).toBe(c.expect.version)
      if (welcomes.length) expect(welcomes[0].host).toBe('fluidd')
      host.close()
    })
  }
})

// ---------------------------------------------------------------------------
// host.json: the scenarios, with Fluidd's adapter
// ---------------------------------------------------------------------------

const FILE = new TextEncoder().encode('G28\nG1 X10 Y10\n')

async function sha256 (bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

type Live = MoonrakerPrinter & { bridge: BridgePrinter }
type Step = Record<string, any>

/** The end states of a job (history status → print_stats state). */
const ENDED: Record<string, string> = { completed: 'complete', cancelled: 'cancelled', error: 'error' }

async function until (ready: () => boolean, what: string, ms = 2000) {
  const deadline = Date.now() + ms
  while (!ready()) {
    if (Date.now() > deadline) throw new Error(`not within ${ms} ms: ${what}`)
    await new Promise(resolve => setTimeout(resolve, 2))
  }
}

interface RawPort {
  request (op: string, params: Record<string, unknown>, transfer?: Transferable[], signal?: AbortSignal): Promise<unknown>;
  close (): void;
}

/** The frame's end of the port, with no client rules of its own: the host's rules are what is tested. */
function rawPort (port: MessagePort): RawPort {
  let next = 1
  const waiting = new Map<number, { resolve:(v: unknown) => void, reject: (e: unknown) => void }>()
  port.onmessage = (e: MessageEvent) => {
    const m = e.data as { re?: number, result?: unknown, error?: unknown, progress?: unknown }
    if (typeof m.re !== 'number' || 'progress' in m) return
    const w = waiting.get(m.re)
    waiting.delete(m.re)
    if (!w) return
    if ('error' in m) w.reject(m.error)
    else w.resolve(m.result)
  }
  return {
    request (op, params, transfer = [], signal) {
      const id = next++
      return new Promise((resolve, reject) => {
        waiting.set(id, { resolve, reject })
        signal?.addEventListener('abort', () => {
          waiting.delete(id)
          port.postMessage({ v: 1, id: next++, op: 'cancel', params: { printer: params.printer, id } })
          reject(Object.assign(new Error('Cancelled'), { kind: 'cancelled' }))
        })
        port.postMessage({ v: 1, id, op, params }, transfer)
      })
    },
    close: () => port.close()
  }
}

async function runScenario (c: { selected: string, capabilities?: string[], steps: Step[] }) {
  const printers: Record<string, Live> = {}
  for (const [name, p] of Object.entries(hostCases.printers as Record<string, Record<string, unknown>>)) {
    printers[name] = { ...newPrinter(name), bridge: subst(p) as BridgePrinter }
  }
  let selected: string | null = c.selected
  let clock = 1_000_000
  let dialogs = 0
  let asked: string | null = null
  let dialog: Step['dialog']
  let cancelRequest: (() => void) | null = null
  const moonraker = fakeMoonraker(printers, () => selected)

  const waitAbort = (signal: AbortSignal) => new Promise<never>((_resolve, reject) =>
    signal.aborted ? reject(new Error('aborted')) : signal.addEventListener('abort', () => reject(new Error('aborted'))))

  const adapter = createFluiddAdapter({
    http: moonraker.http,
    selected: () => (selected ? printers[selected].bridge : null),
    reportsProgress: () => true,
    status: key => ({
      snapshot: () => ({ status: { print_stats: { state: Object.values(printers).find(p => p.bridge.key === key)?.state ?? '' } }, eventtime: null }),
      subscribe: () => () => {}
    }),
    confirm: async (req): Promise<ConfirmAnswer> => {
      dialogs++
      asked = req.plateClear
      if (dialog === undefined) throw new Error('the dialog opened, but the step expected none')
      if (typeof dialog === 'object') {
        // While it is open: the host switches printer, a printer changes, or the frame cancels the request.
        if ('select' in dialog) selected = dialog.select
        if (dialog.set) for (const [name, patch] of Object.entries(dialog.set as Record<string, any>)) Object.assign(printers[name].bridge, patch)
        if (dialog.cancel) cancelRequest?.()
        else host.printerChanged()
        return waitAbort(req.signal)
      }
      if (dialog === 'upload-only' || dialog === 'close') return { choice: 'upload-only' }
      if (dialog === 'print-unticked') return { choice: 'print', plateClear: false }
      return { choice: 'print', plateClear: dialog === 'print-ticked' || req.plateClear === 'not-needed' }
    }
  })

  const welcomed: { welcome: Welcome, port: MessagePort }[] = []
  const frameWindow = { postMessage: (m: Welcome, _o: string, transfer: unknown[]) => { welcomed.push({ welcome: m, port: transfer[0] as MessagePort }) } }
  const win = fakeWindow()
  const log: HostLogEntry[] = []
  const host = createBridgeHost({
    frame: { window: () => frameWindow, origin: 'https://slicer.example' },
    target: win,
    host: 'fluidd',
    hostVersion: 'test',
    theme: 'dark',
    capabilities: c.capabilities,
    adapter,
    now: () => clock,
    log: entry => { log.push(entry) }
  })
  let nonce = 0
  const hello = (): RawPort => {
    win.dispatch({ source: frameWindow as any, origin: 'https://slicer.example', data: { protocol: 'printer-bridge', type: 'hello', versions: [1], app: 't', appVersion: 't', nonce: (++nonce).toString(16).padStart(32, '0') } })
    return rawPort(welcomed[welcomed.length - 1].port)
  }
  let client = hello()
  const outcome = async (promise: Promise<unknown>) => promise.then(result => ({ result, error: undefined as unknown }), error => ({ result: undefined as unknown, error }))

  // The vectors' "set" patches what the host says of a printer (online, role) and what it is doing (state, file).
  const patch = (name: string, values: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(values)) {
      if (k in printers[name].bridge) (printers[name].bridge as any)[k] = v
      else (printers[name] as any)[k] = v
    }
  }

  try {
    for (const [i, step] of c.steps.entries()) {
      const what = `step ${i + 1}`
      moonraker.calls.length = 0
      dialogs = 0
      asked = null
      dialog = step.dialog
      moonraker.during = null
      cancelRequest = null
      if ('select' in step && !step.request && !step.upload) {
        selected = step.select
        host.printerChanged()
        continue
      }
      if (step.set) {
        for (const [name, values] of Object.entries(step.set as Record<string, Record<string, unknown>>)) patch(name, values)
        host.printerChanged()
        continue
      }
      if (step.finish) {
        const p = printers[step.finish]
        const status = step.status ?? 'completed'
        Object.assign(p.jobs[p.jobs.length - 1], { status, filament_used: step.filament_used ?? 0 })
        p.state = ENDED[status]
        continue
      }
      if (step.hostStart) {
        const p = printers[step.hostStart.printer]
        moonraker.addJob(p, step.hostStart.filename)
        Object.assign(p, { state: 'printing', filename: step.hostStart.filename })
        continue
      }
      if (step.advance) {
        clock += step.advance
        continue
      }
      if (step.reload) {
        client.close()
        client = hello()
        continue
      }
      let got: { result: unknown, error: unknown }
      const abort = new AbortController()
      const op = step.upload ? 'files.upload' : step.request.op as string
      if (step.upload) {
        const params = subst(step.upload) as { printer: string, name: string }
        if (step.during?.select) moonraker.during = () => { selected = step.during.select; host.printerChanged() }
        if (step.during?.cancel) moonraker.during = () => abort.abort()
        const bytes = FILE.slice().buffer
        got = await outcome(client.request('files.upload', { printer: params.printer, name: params.name, size: FILE.byteLength, checksum: await sha256(FILE), bytes }, [bytes], abort.signal))
      } else {
        const request = subst(step.request) as { op: string, params: Record<string, unknown> }
        cancelRequest = () => abort.abort()
        got = await outcome(client.request(request.op, request.params, [], abort.signal))
      }
      if (abort.signal.aborted) await until(() => log.some(e => e.kind === 'refused' && e.op === op && e.error.kind === 'cancelled'), `${what}: the host ended the ${op}`)
      if (step.expect.error) {
        expect(got.error, `${what}: expected ${step.expect.error}, got ${JSON.stringify(got.result)}`).toBeTruthy()
        expect((got.error as { kind: string }).kind, `${what}: ${JSON.stringify(got.error)}`).toBe(step.expect.error)
      } else {
        expect(got.error, `${what}: ${JSON.stringify(got.error)}`).toBeUndefined()
        expectPartial(got.result, step.expect.result, what)
      }
      expect(moonraker.calls, `${what}: the printer's writes`).toEqual(step.calls ?? [])
      if (step.dialog === undefined) expect(dialogs, `${what}: no dialog`).toBe(0)
      if (step.asked !== undefined) expect(asked, `${what}: the dialog's Plate is clear`).toBe(step.asked)
    }
  } finally {
    client.close()
    host.close()
  }
}

describe('vectors: the host\'s rules, with Fluidd\'s adapter', () => {
  for (const c of hostCases.cases as any[]) it(c.name, () => runScenario(c))
})
