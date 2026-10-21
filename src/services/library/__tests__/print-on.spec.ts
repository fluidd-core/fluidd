/**
 * @vitest-environment node
 */
import Vue from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveToLibrary } from '../save'
import { createLibraryClient } from '../api'
import { gzip, sha256Hex } from '../bytes'
import { downloadSharedGcode, gcodeFileName, sendToPrinter, watchForStart, type PrintTarget, type SendMode } from '../print-on'
import { resetLibrary, setLibraryClient } from '../store'
import { fakeService } from './fakeService'

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  start: vi.fn(),
  queue: vi.fn(),
  active: { slug: null as string | null }
}))

vi.mock('@/api/httpClientActions', () => ({
  httpClientActions: {
    serverFilesUploadPost: mocks.upload,
    post: (url: string, data: { filename: string }) => (url === '/printer/print/start' ? mocks.start(data.filename) : Promise.reject(new Error(url)))
  }
}))
vi.mock('@/api/socketActions', () => ({ SocketActions: { serverJobQueuePostJob: mocks.queue } }))
vi.mock('@/services/printer-pages', () => ({
  isActiveSlug: (slug: string) => slug === mocks.active.slug,
  printerPath: (slug: string, page = '') => (page ? `/${slug}/${page}` : `/${slug}`)
}))
vi.mock('@/services/muon-cloud/state', async () => {
  const { default: V } = await import('vue')
  return { cloudState: V.observable({ account: { id: 'jack' } }), cloudPrinterConnection: async () => { throw new Error('none') } }
})

const GCODE = '; Hinge bracket\nG28\nG1 X10 Y10 E1\n'.repeat(20)
const HAZEL: PrintTarget = { id: 'a'.repeat(64), name: 'Hazel', slug: 'hazel-52be', active: false }

/** The printer Fluidd is on, as much of Fluidd's store as Print on… reads: PLA loaded, a 0.4 mm nozzle, idle. */
function fakeStore (material = 'PLA') {
  const state = Vue.observable({
    config: { apiUrl: 'http://hazel.local', uiSettings: { spoolman: { autoSpoolSelectionDialog: false } } },
    printer: {
      printer: {
        print_stats: { state: 'standby', filename: '' },
        save_variables: { variables: { muon_material: material } },
        configfile: { settings: { extruder: { nozzle_diameter: 0.4 } } }
      }
    }
  })
  const watcher = new Vue()
  return {
    state,
    getters: { 'socket/getConnectionState': true, 'auth/getAuthenticated': true, 'printer/getKlippyReady': true, 'spoolman/getAvailable': false },
    dispatch: vi.fn(async () => {}),
    commit: vi.fn(),
    watch: (getter: (s: typeof state) => unknown, cb: (value: any) => void) => watcher.$watch(() => getter(state), cb),
    printing: (filename: string) => { state.printer.printer.print_stats = { state: 'printing', filename } }
  }
}

async function savedPrint () {
  const service = fakeService({ presign: true })
  setLibraryClient(service.client())
  const saved = await saveToLibrary(service.client(), {
    item: null,
    name: 'Hinge bracket',
    origin: 'save',
    consent: null,
    project: new Uint8Array([80, 75, 3, 4]).buffer,
    outputs: [{ gcode: new TextEncoder().encode(GCODE).buffer, name: 'hinge.gcode', setup: { printerModel: 'Muon3D M1', nozzleMm: 0.4, material: 'PLA' }, printSeconds: 600, filamentGrams: 3 }],
    thumbnail: null,
    summary: {}
  })
  return { service, item: saved.item, setup: saved.item.setups![0] }
}

const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await Vue.nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

async function send (mode: SendMode, store = fakeStore(), order: string[] = []) {
  const { service, item, setup } = await savedPrint()
  const router = { push: vi.fn(async (path: string) => { order.push(`open ${path}`); mocks.active.slug = 'hazel-52be' }) }
  const sent = sendToPrinter({ router: router as never, store: store as never, item, setup, target: HAZEL, mode })
  return { service, item, store, sent }
}

beforeEach(() => {
  resetLibrary('jack')
  mocks.active.slug = null
  for (const m of [mocks.upload, mocks.start, mocks.queue]) m.mockReset()
  mocks.upload.mockImplementation(async (file: File) => ({ data: { item: { path: file.name } } }))
})

describe('Print on…', () => {
  it('downloads and unpacks the G-code, opens the printer, uploads through Fluidd, then starts it', async () => {
    const order: string[] = []
    mocks.upload.mockImplementation(async (file: File, path: string, root: string, print: boolean) => {
      order.push(`upload ${file.name} ${path || '(top)'} ${root} print=${print}`)
      expect(await file.text()).toBe(GCODE)
      return { data: { item: { path: file.name } } }
    })
    mocks.start.mockImplementation(async (path: string) => { order.push(`start ${path}`) })
    const { sent } = await send('print', fakeStore(), order)
    await sent
    expect(order).toEqual([
      'open /hazel-52be/jobs',
      'upload Hinge bracket.gcode (top) gcodes print=false',
      'start Hinge bracket.gcode'
    ])
    expect(mocks.queue).not.toHaveBeenCalled()
  })

  it('counts the print as printed on that printer once the printer answers its start, and once', async () => {
    const { service, item, sent } = await send('print')
    await sent
    await settle()
    expect(service.events).toEqual([{
      item: item.id,
      kind: 'printed',
      printer_name: 'Hazel',
      setup: { printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PLA' },
      version: 1
    }])
  })

  it('counts nothing when the printer refuses the start', async () => {
    mocks.start.mockRejectedValueOnce(new Error('Printer is busy'))
    const { service, sent } = await send('print')
    await expect(sent).rejects.toThrow('Printer is busy')
    await settle()
    expect(service.events).toEqual([])
  })

  it('counts a queued print once the printer prints that file, and only once', async () => {
    const store = fakeStore()
    store.state.printer.printer.print_stats = { state: 'printing', filename: 'other.gcode' }
    const { service, item, sent } = await send('queue', store)
    await sent
    await settle()
    expect(service.events).toEqual([])

    store.printing('another.gcode')
    await settle()
    expect(service.events).toEqual([])

    store.printing('Hinge bracket.gcode')
    await settle()
    expect(service.events).toEqual([expect.objectContaining({ item: item.id, kind: 'printed', printer_name: 'Hazel' })])

    store.state.printer.printer.print_stats = { state: 'paused', filename: 'Hinge bracket.gcode' }
    await settle()
    store.printing('Hinge bracket.gcode')
    await settle()
    expect(service.events).toHaveLength(1)
  })

  it('stops before the upload when the printer turns out to have another material loaded', async () => {
    const { sent } = await send('print', fakeStore('PETG'))
    await expect(sent).rejects.toThrow('PETG loaded. This print was sliced for PLA.')
    expect(mocks.upload).not.toHaveBeenCalled()
    expect(mocks.start).not.toHaveBeenCalled()
  })

  it('never starts on a printer that is printing something else: that goes in its queue', async () => {
    const store = fakeStore()
    store.printing('other.gcode')
    const { sent } = await send('print', store)
    await expect(sent).rejects.toThrow('Add this to its queue instead')
    expect(mocks.upload).not.toHaveBeenCalled()

    mocks.active.slug = null
    const queued = await send('queue', store)
    await queued.sent
    expect(mocks.queue).toHaveBeenCalledWith(['Hinge bracket.gcode'])
    expect(mocks.start).not.toHaveBeenCalled()
  })

  it('Save to the printer uploads it and starts nothing', async () => {
    const { sent } = await send('save')
    await sent
    expect(mocks.upload).toHaveBeenCalledTimes(1)
    expect(mocks.start).not.toHaveBeenCalled()
    expect(mocks.queue).not.toHaveBeenCalled()
  })

  it('opens the Spoolman dialog first, when Fluidd asks for a spool before a print', async () => {
    const store = fakeStore()
    store.getters['spoolman/getAvailable'] = true
    store.state.config.uiSettings.spoolman.autoSpoolSelectionDialog = true
    const { sent } = await send('print', store)
    await sent
    expect(store.commit).toHaveBeenCalledWith('spoolman/setDialogState', { show: true, filename: 'Hinge bracket.gcode' })
    expect(mocks.start).not.toHaveBeenCalled()
  })

  it('counts nothing once Fluidd has switched to another printer', async () => {
    const store = fakeStore()
    const started = vi.fn()
    watchForStart(store as never, 'Hinge bracket.gcode', started)
    store.state.config.apiUrl = 'http://walnut.local'
    await settle()
    store.printing('Hinge bracket.gcode')
    await settle()
    expect(started).not.toHaveBeenCalled()
  })

  it('names the file for the printer: no path, nothing a shell reads', () => {
    expect(gcodeFileName({ name: 'Hinge bracket' })).toBe('Hinge bracket.gcode')
    expect(gcodeFileName({ name: '../config/printer.cfg' })).toBe('config-printer.cfg.gcode')
    expect(gcodeFileName({ name: 'a/b\\c:d*e?f"g<h>i|j' })).toBe('a-b-c-d-e-f-g-h-i-j.gcode')
  })
})

describe('downloadSharedGcode', () => {
  function serve (response: () => Response) {
    const fetcher = vi.fn<[string, RequestInit], Promise<Response>>(async () => response())
    setLibraryClient(createLibraryClient({ baseUrl: 'https://models.invalid', assertion: { get: async () => 'a', drop: () => {} }, fetch: fetcher as unknown as typeof fetch }))
    return fetcher
  }

  it('POSTs {} and returns the served G-code, unzipped, after checking the listed hash and size', async () => {
    const text = new TextEncoder().encode(GCODE)
    const stored = await gzip(text)
    const fetcher = serve(() => new Response(stored))
    const bytes = await downloadSharedGcode('share', 'file', { sha256: await sha256Hex(stored), size_bytes: stored.byteLength })
    expect(bytes).toEqual(text)
    expect(JSON.parse((fetcher.mock.calls[0][1] as RequestInit).body as string)).toEqual({})
  })

  it('refuses bytes that do not match the listing', async () => {
    const stored = await gzip(new TextEncoder().encode(GCODE))
    serve(() => new Response(stored))
    await expect(downloadSharedGcode('share', 'file', { sha256: 'f'.repeat(64), size_bytes: stored.byteLength })).rejects.toThrow('did not match')
  })

  it('surfaces a 4xx refusal', async () => {
    serve(() => new Response(JSON.stringify({ error: { code: 'not_found', message: 'Not found' } }), { status: 404 }))
    await expect(downloadSharedGcode('share', 'file')).rejects.toMatchObject({ code: 'not_found' })
  })
})
