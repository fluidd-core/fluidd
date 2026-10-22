import { beforeEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import Vuex from 'vuex'
import { createRun, observePrintRuns, rememberLibraryFile, resetRunReportingForTests } from '../runs'
import { gzip, sha256Hex } from '../bytes'
import { mutations } from '@/store/printer/mutations'
import { defaultState } from '@/store/printer/state'
import { cloudState } from '@/services/muon-cloud/state'

vi.mock('../assertion', () => ({ modelsAssertion: { get: vi.fn().mockResolvedValue('assertion') } }))

const reply = (status: number, body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))

describe('Library run reporting', () => {
  beforeEach(() => {
    resetRunReportingForTests()
    cloudState.activePrinterId = null
    cloudState.printers.splice(0)
    vi.unstubAllGlobals()
  })

  // POST /v1/library/runs, per the contract: printer_id, printer_name, reporter 'control', at least one of
  // gcode_sha256 (64 lowercase hex, the STORED bytes) or file_name; item_id+version together; publication_id.
  it('sends the stored-bytes hash and own item+version with an idempotency key', async () => {
    const stored = await gzip(new TextEncoder().encode('G28\nG1 X10 E1\n'.repeat(40)))
    const gcode_sha256 = await sha256Hex(stored)
    const fetcher = vi.fn().mockImplementation(() => reply(201, { id: 'run-1' }))
    await createRun({ printer_id: 'p1', printer_name: 'Pine', file_name: 'cube.gcode', gcode_sha256, item_id: 'item', version: 3 }, fetcher)
    const [url, init] = fetcher.mock.calls[0]
    expect(url).toMatch(/\/v1\/library\/runs$/)
    expect(init.headers['Idempotency-Key']).toMatch(/^control:p1:/)
    expect(JSON.parse(init.body)).toEqual({ printer_id: 'p1', printer_name: 'Pine', gcode_sha256, file_name: 'cube.gcode', reporter: 'control', item_id: 'item', version: 3 })
  })

  it('sends a public print with its publication_id and no item_id or version', async () => {
    const gcode_sha256 = 'c'.repeat(64)
    const fetcher = vi.fn().mockImplementation(() => reply(201, { id: 'run-1' }))
    await createRun({ printer_id: 'p1', printer_name: 'Pine', file_name: 'shared.gcode', gcode_sha256, publication_id: 'share-id' }, fetcher)
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ printer_id: 'p1', printer_name: 'Pine', gcode_sha256, file_name: 'shared.gcode', reporter: 'control', publication_id: 'share-id' })
  })

  it('never sends item_id without a version, or a version without item_id', async () => {
    const fetcher = vi.fn().mockImplementation(() => reply(201, { id: 'run-1' }))
    await createRun({ printer_id: 'p1', printer_name: 'Pine', file_name: 'a.gcode', item_id: 'item' }, fetcher)
    await createRun({ printer_id: 'p1', printer_name: 'Pine', file_name: 'b.gcode', version: 2 }, fetcher)
    for (const [, init] of fetcher.mock.calls) expect(Object.keys(JSON.parse(init.body)).sort()).toEqual(['file_name', 'printer_id', 'printer_name', 'reporter'])
  })

  it('stops permanently for this page after consent_required', async () => {
    const fetcher = vi.fn().mockImplementation(() => reply(403, { error: { code: 'consent_required' } }))
    await createRun({ printer_id: 'p1', printer_name: 'Pine', file_name: 'one.gcode' }, fetcher)
    await createRun({ printer_id: 'p1', printer_name: 'Pine', file_name: 'two.gcode' }, fetcher)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('retries transient failures a bounded number of times', async () => {
    const fetcher = vi.fn().mockImplementation(() => reply(503, {}))
    await createRun({ printer_id: 'p1', printer_name: 'Pine', file_name: 'cube.gcode' }, fetcher)
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('reports in-place Vuex start, pause, resume, completion, cancellation, error, and later prints', async () => {
    Vue.use(Vuex)
    const store = new Vuex.Store<any>({
      modules: { printer: { namespaced: true, state: defaultState(), mutations } },
      state: { config: { apiUrl: 'http://pine', instances: [{ apiUrl: 'http://pine', endpointId: 'p1' }], displayName: 'Pine' } }
    })
    let run = 0
    const fetcher = vi.fn(async (_url: string, init: RequestInit) => reply(init.method === 'POST' ? 201 : 200, init.method === 'POST' ? { id: `run-${++run}` } : {}))
    vi.stubGlobal('fetch', fetcher)
    const setStats = async (payload: Record<string, unknown>) => {
      store.commit('printer/setSocketNotify', { key: 'print_stats', payload })
      await Vue.nextTick(); await Promise.resolve(); await Vue.nextTick()
    }
    const stop = observePrintRuns(store)

    await setStats({ state: 'standby', filename: '' })
    await setStats({ state: 'printing', filename: 'one.gcode', print_duration: 1 })
    await vi.waitFor(() => expect(fetcher.mock.calls.filter(([, init]) => init.method === 'POST')).toHaveLength(1))
    await new Promise(resolve => setTimeout(resolve, 0))
    await setStats({ state: 'paused', print_duration: 2 })
    await setStats({ state: 'printing', print_duration: 3 })
    expect(fetcher.mock.calls.filter(([, init]) => init.method === 'POST')).toHaveLength(1)
    await setStats({ state: 'complete', total_duration: 4 })
    await setStats({ state: 'printing', filename: 'two.gcode', print_duration: 0, total_duration: 0 })
    await vi.waitFor(() => expect(fetcher.mock.calls.filter(([, init]) => init.method === 'POST')).toHaveLength(2))
    await new Promise(resolve => setTimeout(resolve, 0))
    await setStats({ state: 'cancelled', print_duration: 2 })
    await setStats({ state: 'printing', filename: 'three.gcode', print_duration: 0 })
    await vi.waitFor(() => expect(fetcher.mock.calls.filter(([, init]) => init.method === 'POST')).toHaveLength(3))
    await new Promise(resolve => setTimeout(resolve, 0))
    await setStats({ state: 'error', print_duration: 1 })

    const posts = fetcher.mock.calls.filter(([, init]) => init.method === 'POST')
    const patches = fetcher.mock.calls.filter(([, init]) => init.method === 'PATCH')
    expect(posts.map(([, init]) => JSON.parse(init.body as string).file_name)).toEqual(['one.gcode', 'two.gcode', 'three.gcode'])
    expect(patches.map(([, init]) => JSON.parse(init.body as string).outcome)).toEqual(['finished', 'cancelled', 'failed'])
    stop()
  })

  it('reports a file Control did not upload by name only: no hash, and nothing is downloaded to get one', async () => {
    Vue.use(Vuex)
    const store = new Vuex.Store<any>({
      modules: { printer: { namespaced: true, state: defaultState(), mutations } },
      state: { config: { apiUrl: 'http://pine', instances: [{ apiUrl: 'http://pine', endpointId: 'p1' }], displayName: 'Pine' } }
    })
    const fetcher = vi.fn(async (_url: string, _init: RequestInit) => reply(201, { id: 'run-1' }))
    vi.stubGlobal('fetch', fetcher)
    const stop = observePrintRuns(store)
    store.commit('printer/setSocketNotify', { key: 'print_stats', payload: { state: 'standby', filename: '' } }); await Vue.nextTick()
    store.commit('printer/setSocketNotify', { key: 'print_stats', payload: { state: 'printing', filename: 'from-panel.gcode' } })
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    expect(fetcher.mock.calls.map(([, init]) => init.method)).toEqual(['POST'])
    expect(JSON.parse(fetcher.mock.calls[0][1].body as string)).toEqual({ printer_id: 'p1', printer_name: 'Pine', file_name: 'from-panel.gcode', reporter: 'control' })
    stop()
  })

  it('attaches the remembered Library hand-off to the next start of that file, once', async () => {
    Vue.use(Vuex)
    const store = new Vuex.Store<any>({
      modules: { printer: { namespaced: true, state: defaultState(), mutations } },
      state: { config: { apiUrl: 'http://pine', instances: [{ apiUrl: 'http://pine', endpointId: 'p1' }], displayName: 'Pine' } }
    })
    const fetcher = vi.fn(async () => reply(201, { id: 'run-1' }))
    vi.stubGlobal('fetch', fetcher)
    const gcode_sha256 = await sha256Hex(await gzip(new TextEncoder().encode('G28\n'.repeat(50))))
    rememberLibraryFile('cube.gcode', { gcode_sha256, publication_id: 'share-id' })
    const stop = observePrintRuns(store)
    const set = async (payload: Record<string, unknown>) => { store.commit('printer/setSocketNotify', { key: 'print_stats', payload }); await Vue.nextTick() }
    await set({ state: 'standby', filename: '' })
    await set({ state: 'printing', filename: 'cube.gcode' })
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    expect(JSON.parse((fetcher.mock.calls as any)[0][1].body)).toEqual({ printer_id: 'p1', printer_name: 'Pine', gcode_sha256, file_name: 'cube.gcode', reporter: 'control', publication_id: 'share-id' })
    await set({ state: 'complete' })
    await set({ state: 'printing', filename: 'cube.gcode' })
    await vi.waitFor(() => expect(fetcher.mock.calls.filter(([, init]: any) => init.method === 'POST')).toHaveLength(2))
    expect(JSON.parse((fetcher.mock.calls as any).filter(([, init]: any) => init.method === 'POST')[1][1].body)).not.toHaveProperty('gcode_sha256')
    stop()
  })

  it('does not finish or start a run on the wrong printer during an asynchronous switch', async () => {
    Vue.use(Vuex)
    cloudState.activePrinterId = 'p1'
    cloudState.printers.push({ id: 'p1', name: 'Pine' } as any, { id: 'p2', name: 'Oak' } as any)
    const store = new Vuex.Store<any>({ modules: { printer: { namespaced: true, state: defaultState(), mutations } }, state: { config: { apiUrl: 'http://pine', instances: [] } } })
    const fetcher = vi.fn(async (_url: string, init: RequestInit) => reply(init.method === 'POST' ? 201 : 200, init.method === 'POST' ? { id: 'run-p1' } : {}))
    vi.stubGlobal('fetch', fetcher)
    const stop = observePrintRuns(store)
    store.commit('printer/setSocketNotify', { key: 'print_stats', payload: { state: 'standby' } }); await Vue.nextTick()
    store.commit('printer/setSocketNotify', { key: 'print_stats', payload: { state: 'printing', filename: 'pine.gcode' } })
    await Vue.nextTick(); await Promise.resolve(); await Vue.nextTick()
    cloudState.activePrinterId = 'p2'
    store.commit('printer/setSocketNotify', { key: 'print_stats', payload: { state: 'complete' } })
    await Vue.nextTick(); await Promise.resolve()

    expect(fetcher.mock.calls.filter(([, init]) => init.method === 'POST')).toHaveLength(1)
    expect(JSON.parse(fetcher.mock.calls[0][1].body as string).printer_id).toBe('p1')
    expect(fetcher.mock.calls.filter(([, init]) => init.method === 'PATCH')).toHaveLength(0)
    stop()
  })
})
