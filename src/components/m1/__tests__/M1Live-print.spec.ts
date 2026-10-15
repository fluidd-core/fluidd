import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/m1-3d/parked', () => ({
  built: vi.fn(async () => {}),
  canDrawWebgl: vi.fn(() => true),
  loadViewer: vi.fn(async () => ({})),
  newCanvas: vi.fn(() => document.createElement('canvas')),
  park: vi.fn(),
  prebuild: vi.fn(async () => {}),
  takeParked: vi.fn(() => null)
}))
vi.mock('@/services/startup/idle', () => ({ afterFirstPaint: vi.fn() }))
vi.mock('@/services/m1-3d/live-sync', () => {
  const sync = {
    accessories: { reducedMotion: false },
    setAccessories: vi.fn(),
    newPrint: vi.fn(),
    setPose: vi.fn(),
    observe: vi.fn(),
    setPath: vi.fn(),
    setFileDone: vi.fn(),
    follow: vi.fn(),
    trace: { clear: vi.fn() }
  }
  return { liveSyncFor: vi.fn(() => sync) }
})
const cloud = vi.hoisted(() => ({ cloudState: { activePrinterId: null as string | null } }))
vi.mock('@/services/muon-cloud/state', () => cloud)
const http = vi.hoisted(() => ({ serverFilesGet: vi.fn() }))
vi.mock('@/api/httpClientActions', () => ({ httpClientActions: http }))

const { default: M1Live } = await import('../M1Live.vue')

/** A part `layers` high, one extruding line a layer, then `padding` bytes of slicer comments. */
function gcode (layers: number, padding = 0): string {
  const lines = ['G90', 'M82', 'G92 E0', 'G1 X100 Y100 F9000']
  for (let n = 1; n <= layers; n++) lines.push(`G1 Z${(0.2 * n).toFixed(1)}`, `G1 X${n % 2 ? 80 : 120} Y100 E${n}`)
  return lines.join('\n') + '\n' + ';'.repeat(padding)
}

function mount (file: { size: number }, text: string) {
  const dispatch = vi.fn()
  const printer = {
    toolhead: { position: [0, 0, 0, 0], homed_axes: 'xyz' },
    print_stats: { state: 'printing', filename: 'Harry/tray_v2_PETG.gcode' },
    virtual_sdcard: { file_position: Math.floor(text.length / 2) },
    current_file: { filename: 'tray_v2_PETG.gcode', path: 'Harry', size: file.size },
    idle_timeout: {},
    configfile: {},
    save_variables: {}
  }
  const $store = {
    state: {
      printer: { printer },
      gcodePreview: { parserWorker: null },
      console: { console: [] },
      config: { apiUrl: '', uiSettings: { general: {} } },
      socket: { open: true },
      version: {}
    },
    getters: new Proxy({ 'printer/getPrintProgress': 0.5, 'printer/getPins': [], 'printer/getAllLeds': [], 'gcodePreview/getFile': undefined } as Record<string, unknown>, {
      get: (t, key) => t[key as string] ?? (() => undefined)
    }),
    dispatch,
    subscribeAction: vi.fn(() => () => {})
  }
  const wrapper = shallowMount(M1Live, {
    mocks: { $t: (key: string) => key, $store, $vuetify: { theme: { dark: true }, breakpoint: {} }, $waits: {} },
    computed: { dark: () => true }
  })
  ;(wrapper.vm as any).live = true
  return { wrapper, dispatch }
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class { observe () {} disconnect () {} })
  http.serverFilesGet.mockReset()
  cloud.cloudState.activePrinterId = null
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the live M1 opened part-way through a print', () => {
  it('draws everything printed so far from a job too big for the preview', async () => {
    // 14 Oct: the part started from the layer printing when the page opened;
    // a job over 16 MB was never read, so only what was laid after showed.
    const text = gcode(40, 17 * 1024 * 1024)
    http.serverFilesGet.mockResolvedValue({ data: new TextEncoder().encode(text).buffer })
    const { wrapper, dispatch } = mount({ size: text.length }, text)

    await (wrapper.vm as any).loadJob()

    expect(http.serverFilesGet).toHaveBeenCalledWith('gcodes/Harry/tray_v2_PETG.gcode', { responseType: 'arraybuffer' })
    expect(dispatch).not.toHaveBeenCalledWith('gcodePreview/loadGcode', expect.anything())
    const path = (wrapper.vm as any).printPath
    expect(path.count).toBe(40)
    expect(path.positions[2]).toBeCloseTo(0.2)
    wrapper.destroy()
  })

  it('reads the job through Muon3D too, as it does on this network', async () => {
    // Through Muon3D the stage never read the file, and laid the part only
    // from the reports after the page opened.
    cloud.cloudState.activePrinterId = 'boxwood'
    const text = gcode(40)
    http.serverFilesGet.mockResolvedValue({ data: text })
    const { wrapper, dispatch } = mount({ size: text.length }, text)

    await (wrapper.vm as any).loadJob()

    expect(http.serverFilesGet).toHaveBeenCalledWith('gcodes/Harry/tray_v2_PETG.gcode', expect.objectContaining({ responseType: 'text' }))
    expect(dispatch).toHaveBeenCalledWith('gcodePreview/loadGcode', expect.objectContaining({ gcode: text }))
    wrapper.destroy()
  })
})
