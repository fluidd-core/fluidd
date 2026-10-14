import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const parked = vi.hoisted(() => ({
  built: vi.fn(async () => {}),
  canDrawWebgl: vi.fn(() => true),
  loadViewer: vi.fn(async () => ({})),
  newCanvas: vi.fn(() => document.createElement('canvas')),
  park: vi.fn(),
  prebuild: vi.fn(async () => {}),
  takeParked: vi.fn(() => null)
}))
const idle = vi.hoisted(() => ({
  afterFirstPaint: vi.fn()
}))

vi.mock('@/services/m1-3d/parked', () => parked)
vi.mock('@/services/startup/idle', () => idle)
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
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { activePrinterId: null } }))

const { default: M1Live } = await import('../M1Live.vue')

const mocks = {
  $t: (key: string) => key,
  $store: {
    state: {
      printer: {
        printer: {
          toolhead: { position: [0, 0, 0, 0], homed_axes: '' },
          print_stats: {},
          idle_timeout: {},
          configfile: {},
          save_variables: {}
        }
      },
      gcodePreview: { parserWorker: null },
      console: { console: [] },
      config: { apiUrl: '', uiSettings: { general: {} } },
      socket: { open: false },
      version: {}
    },
    getters: new Proxy({ 'printer/getPrintProgress': 0, 'printer/getPins': [], 'printer/getAllLeds': [], 'gcodePreview/getFile': undefined } as Record<string, unknown>, {
      // Most mixins read getters as curried functions; the few used as
      // values are filled in above, the rest need only a falsy readout.
      get: (t, key) => t[key as string] ?? (() => undefined)
    }),
    subscribeAction: vi.fn(() => () => {})
  },
  $vuetify: { theme: { dark: true }, breakpoint: {} },
  $waits: {}
}

class FakeObserver {
  static seen: Array<IntersectionObserverCallback> = []
  cb: IntersectionObserverCallback
  constructor (cb: IntersectionObserverCallback) {
    this.cb = cb
    FakeObserver.seen.push(cb)
  }

  observe () {
    this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }

  disconnect () {}
}

describe('M1Live arming (KAN-525)', () => {
  beforeEach(() => {
    FakeObserver.seen = []
    vi.stubGlobal('IntersectionObserver', FakeObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('does not ask for WebGL at mount, only once afterFirstPaint has run', () => {
    const wrapper = shallowMount(M1Live, { mocks, computed: { dark: () => true } })

    // The intersect fired at mount, but the WebGL probe and the viewer build
    // wait for the app's first paint — canDrawWebgl alone was a ~750 ms long
    // task inside Overview's first frame.
    expect(parked.canDrawWebgl).not.toHaveBeenCalled()
    expect(parked.prebuild).not.toHaveBeenCalled()
    expect(idle.afterFirstPaint).toHaveBeenCalledTimes(1)

    const arm = idle.afterFirstPaint.mock.calls[0][0] as () => void
    arm()
    expect(parked.canDrawWebgl).toHaveBeenCalled()
    expect(parked.prebuild).toHaveBeenCalled()
    expect(wrapper.vm.armed).toBe(true)

    wrapper.destroy()
  })

  it('keeps the static fallback when WebGL is missing, and arms nothing', () => {
    parked.canDrawWebgl.mockReturnValueOnce(false)
    const wrapper = shallowMount(M1Live, { mocks, computed: { dark: () => true } })

    const arm = idle.afterFirstPaint.mock.calls[0][0] as () => void
    arm()
    expect(parked.prebuild).not.toHaveBeenCalled()
    expect(wrapper.vm.armed).toBe(false)

    wrapper.destroy()
  })
})
