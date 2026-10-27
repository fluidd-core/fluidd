/**
 * @vitest-environment node
 */
// Fluidd's host (startSlicerHost): its printer follows what Fluidd shows,
// the frame hears of a new printer before anything about it, a request for a
// stale key is refused, status and console lines come from Fluidd's own
// subscription and only for the printer selected.
import { describe, expect, it, vi } from 'vitest'
import { startSlicerHost } from '../host'
import * as statusFeed from '../statusFeed'
import type { FluiddSelection } from '../selection'
import type { ConfirmAnswer, ConfirmRequest } from '../vendor/printer-client/bridge/host'
import { fakeMoonraker, newPrinter } from './moonraker'

const WALNUT_ID = 'a'.repeat(64)
const OAK_ID = 'b'.repeat(64)

/** A store with Fluidd's printer state and its action subscribers. */
function fakeStore () {
  const subscribers = new Set<(action: { type: string, payload: unknown }, state: any) => void>()
  const state = {
    socket: { acceptingNotifications: true },
    printer: {
      printer: {
        objects: ['print_stats', 'mcu.toolhead', 'webhooks'],
        info: { state: 'ready', hostname: 'walnut' },
        endstops: {},
        print_stats: { state: 'standby', filename: '' },
        'mcu toolhead': { non_critical_disconnected: false },
        webhooks: { state: 'ready' }
      } as Record<string, unknown>
    }
  }
  return {
    state,
    getters: {},
    subscribeAction (fn: any) {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
    dispatch (type: string, payload: unknown) {
      for (const fn of [...subscribers]) fn({ type, payload }, state)
    }
  }
}

const cloudSelection = (id: string, name: string): FluiddSelection => ({
  switching: false,
  cloud: { id, name, model: 'M1', online: true, role: 'operator', shared: false },
  cloudName: name,
  apiUrl: '',
  displayName: '',
  connected: true
})

/** The frame: hello, then the port's messages in order. */
async function setup (initial: FluiddSelection) {
  let selection = initial
  const store = fakeStore()
  const printers = { walnut: newPrinter('walnut'), oak: newPrinter('oak') }
  const moonraker = fakeMoonraker(printers, () => selection.cloud?.id === WALNUT_ID ? 'walnut' : selection.cloud?.id === OAK_ID ? 'oak' : null)
  const listeners = new Set<(e: MessageEvent) => void>()
  const target = { addEventListener: (_t: string, l: any) => { listeners.add(l) }, removeEventListener: (_t: string, l: any) => { listeners.delete(l) } }
  let port: MessagePort | null = null
  const contentWindow = { postMessage: (_m: unknown, _o: string, transfer: unknown[]) => { port = transfer[0] as MessagePort } }
  const frame = { contentWindow, src: '' } as unknown as HTMLIFrameElement
  const dialogs: ConfirmRequest[] = []
  const host = startSlicerHost({
    frame,
    slicerUrl: new URL('http://127.0.0.1:5173/slicer/embed.html'),
    store: store as any,
    http: moonraker.http,
    selection: () => selection,
    remote: () => true,
    fetchIdentity: async () => ({ name: 'walnut', endpoint_id: WALNUT_ID }),
    confirm: async (request): Promise<ConfirmAnswer> => {
      dialogs.push(request)
      return { choice: 'upload-only' }
    },
    theme: 'dark',
    hostVersion: 'test',
    target
  })
  for (const l of listeners) {
    l({ source: contentWindow, origin: 'http://127.0.0.1:5173', data: { protocol: 'printer-bridge', type: 'hello', versions: [1], app: 't', appVersion: 't', nonce: '0'.repeat(32) } } as any)
  }
  const received: any[] = []
  const waiting = new Set<() => void>()
  const p = port as unknown as MessagePort
  // Match the bridge's delayed delivery regression coverage in muon3d-slicer:
  // assertions must follow delivery, rather than assuming it fits in a short sleep.
  p.onmessage = (e: MessageEvent) => {
    setTimeout(() => {
      received.push(e.data)
      for (const check of [...waiting]) check()
    }, 30)
  }
  let id = 0
  const send = (op: string, params: Record<string, unknown>) => {
    p.postMessage({ v: 1, id: ++id, op, params })
    return id
  }
  const receive = (matches: (message: any) => boolean): Promise<any> => {
    const delivered = received.find(matches)
    if (delivered) return Promise.resolve(delivered)
    return new Promise(resolve => {
      const check = () => {
        const message = received.find(matches)
        if (!message) return
        waiting.delete(check)
        resolve(message)
      }
      waiting.add(check)
    })
  }
  return {
    host,
    store,
    moonraker,
    received,
    dialogs,
    send,
    receive,
    select: (next: FluiddSelection) => { selection = next },
    close: () => { p.close(); host.close() }
  }
}

describe('Fluidd\'s host', () => {
  it('names the printer Fluidd shows, and tells the frame first when it changes', async () => {
    const t = await setup(cloudSelection(WALNUT_ID, 'Walnut'))
    const get = t.send('printer.get', {})
    await t.receive(m => m.re === get)
    expect(t.received[0].result.printer).toMatchObject({ key: WALNUT_ID, name: 'Walnut', route: 'cloud', role: 'owner' })

    // Fluidd switches; a request for the old key arrives before anything else told the host.
    t.select(cloudSelection(OAK_ID, 'Oak'))
    const stale = t.send('moonraker.read', { printer: WALNUT_ID, method: 'server.info' })
    await t.receive(m => m.re === stale)
    const barrier = t.send('printer.get', {})
    await t.receive(m => m.re === barrier)
    const changed = t.received.findIndex(m => m.event === 'printer.changed')
    const refused = t.received.findIndex(m => m.re === stale)
    expect(changed).toBeGreaterThan(0)
    expect(t.received[changed]).toMatchObject({ printer: OAK_ID, data: { printer: { key: OAK_ID, name: 'Oak' } } })
    expect(refused).toBeGreaterThan(changed)
    expect(t.received[refused].error.kind).toBe('printer-changed')
    expect(t.moonraker.requests).toEqual([])
    t.close()
  })

  it('tells the frame once per change, and nothing when nothing changed', async () => {
    const t = await setup(cloudSelection(WALNUT_ID, 'Walnut'))
    t.host.refresh()
    t.host.refresh()
    t.select({ ...cloudSelection(WALNUT_ID, 'Walnut'), connected: false })
    t.host.refresh()
    t.host.refresh()
    await t.receive(m => m.event === 'printer.changed')
    const barrier = t.send('printer.get', {})
    await t.receive(m => m.re === barrier)
    const events = t.received.filter(m => m.event === 'printer.changed')
    expect(events).toHaveLength(1)
    expect(events[0].data.printer.online).toBe(false)
    t.close()
  })

  it('selects a network printer only once its identity is known', async () => {
    const t = await setup({ switching: false, cloud: null, apiUrl: 'http://127.0.0.1:7125', displayName: 'Walnut', connected: true })
    // At the welcome the identity was still being asked: no printer yet; then the change.
    await t.receive(m => m.event === 'printer.changed')
    const event = t.received.find(m => m.event === 'printer.changed')
    expect(event).toMatchObject({ printer: WALNUT_ID, data: { printer: { key: WALNUT_ID, route: 'local', role: 'operator', model: 'Muon3D M1' } } })
    t.close()
  })

  it('passes the selected printer\'s status from Fluidd\'s subscription, never another printer\'s', async () => {
    const createStoreStatusFeed = statusFeed.createStoreStatusFeed
    let isFeedCurrent: (() => boolean) | undefined
    vi.spyOn(statusFeed, 'createStoreStatusFeed').mockImplementation((store, isCurrent) => {
      isFeedCurrent = isCurrent
      return createStoreStatusFeed(store, isCurrent)
    })
    const t = await setup(cloudSelection(WALNUT_ID, 'Walnut'))
    const watch = t.send('status.watch', { printer: WALNUT_ID, objects: { print_stats: ['state'], 'mcu toolhead': null } })
    await t.receive(m => m.re === watch)
    expect(t.received.find(m => m.re === watch).result.status).toEqual({ print_stats: { state: 'standby' }, 'mcu toolhead': { non_critical_disconnected: false } })

    t.store.dispatch('printer/onNotifyStatusUpdate', { print_stats: { state: 'printing' }, extruder: { temperature: 200 } })
    await t.receive(m => m.event === 'printer.status' && m.data.status.print_stats?.state === 'printing')
    const printingBarrier = t.send('printer.get', {})
    await t.receive(m => m.re === printingBarrier)
    expect(t.received.filter(m => m.event === 'printer.status').map(m => m.data.status)).toEqual([{ print_stats: { state: 'printing' } }])

    // Fluidd now shows Oak: Oak's notifications never go out under Walnut's key.
    t.select(cloudSelection(OAK_ID, 'Oak'))
    expect(isFeedCurrent?.()).toBe(false)
    t.store.dispatch('printer/onNotifyStatusUpdate', { print_stats: { state: 'error' } })
    const oakBarrier = t.send('printer.get', {})
    await t.receive(m => m.re === oakBarrier)
    expect(t.received.filter(m => m.event === 'printer.status' && m.printer === WALNUT_ID)).toHaveLength(1)
    t.close()
    vi.restoreAllMocks()
  })

  it('passes console lines of the selected printer', async () => {
    const t = await setup(cloudSelection(WALNUT_ID, 'Walnut'))
    t.store.dispatch('socket/notifyGcodeResponse', '// PRINT_START_MARK seq=1')
    await t.receive(m => m.event === 'printer.gcode')
    const barrier = t.send('printer.get', {})
    await t.receive(m => m.re === barrier)
    expect(t.received.find(m => m.event === 'printer.gcode')).toEqual({ v: 1, event: 'printer.gcode', printer: WALNUT_ID, data: { lines: ['// PRINT_START_MARK seq=1'] } })
    t.close()
  })

  it('opens Fluidd\'s dialog only for this frame\'s own upload', async () => {
    const t = await setup(cloudSelection(WALNUT_ID, 'Walnut'))
    const bytes = new TextEncoder().encode('G28\n')
    const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('')
    t.send('print.request', { printer: WALNUT_ID, paths: ['a.gcode'], mode: 'start', plateClear: 'not-needed' })
    const upload = t.send('files.upload', { printer: WALNUT_ID, name: 'a.gcode', size: 4, checksum: digest, bytes: bytes.buffer })
    await t.receive(m => m.re === upload && !('progress' in m))
    const print = t.send('print.request', { printer: WALNUT_ID, paths: ['a.gcode'], mode: 'start', plateClear: 'not-needed' })
    await t.receive(m => m.re === print)
    const barrier = t.send('printer.get', {})
    await t.receive(m => m.re === barrier)
    expect(t.received.filter(m => 're' in m && m.re !== barrier && !('progress' in m)).map(m => m.error?.kind ?? m.result)).toEqual([
      'not-allowed',
      { path: 'a.gcode', size: 4 },
      { decision: 'uploaded-only' }
    ])
    // Remote (Iroh): the upload's progress is indeterminate.
    expect(t.received.filter(m => 'progress' in m).map(m => m.progress)).toEqual([
      { step: 'sending', sent: 0, total: expect.any(Number) },
      { step: 'sending', sent: null, total: expect.any(Number) }
    ])
    expect(t.dialogs).toHaveLength(1)
    // The host read the printer's history itself: no job yet, so nothing on the plate, and no tick asked.
    expect(t.dialogs[0].plateClear).toBe('not-needed')
    expect(t.moonraker.calls).toEqual(['upload walnut a.gcode'])
    t.close()
  })
})

describe('the status snapshot', () => {
  it('holds Klipper\'s objects only, not Fluidd\'s own fields', () => {
    expect(statusFeed.klipperObjects(fakeStore().state.printer.printer)).toEqual({
      print_stats: { state: 'standby', filename: '' },
      'mcu toolhead': { non_critical_disconnected: false },
      webhooks: { state: 'ready' }
    })
  })
})
