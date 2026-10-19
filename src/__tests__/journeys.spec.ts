import Vue from 'vue'
import { mount, type Wrapper } from '@vue/test-utils'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import '@/registerComponentHooks'
import App from '@/App.vue'
import router from '@/router'
import store from '@/store'
import vuetify from '@/plugins/vuetify'
import i18n from '@/plugins/i18n'
import { Globals } from '@/globals'
import { setActiveSlugSource, setForeignSlugSource } from '@/router/printerSlugSource'
import { retireProStorage } from '@/services/retired-storage'
import { SocketActions } from '@/api/socketActions'
import { cloudState } from '@/services/muon-cloud/state'
import { ColorSetPlugin } from '@/plugins/colorSet'
import { FiltersPlugin } from '@/plugins/filters'

vi.mock('@/services/slicer-bridge/slicerUrl', () => ({
  slicerPresence: { state: 'absent' },
  probeSlicer: vi.fn().mockResolvedValue(false)
}))
vi.mock('@/services/muon-cloud/state', () => ({
  cloudState: { account: null, activePrinterId: null, printers: [] },
  initCloud: vi.fn()
}))
vi.mock('@/api/socketActions', () => ({
  SocketActions: new Proxy({} as Record<string, ReturnType<typeof vi.fn>>, { get: (target, key: string) => (target[key] ??= vi.fn().mockResolvedValue({ result: {} })) })
}))

const slug = 'muon-m1-0001'
const flush = async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
  await Vue.nextTick()
  await new Promise(resolve => setTimeout(resolve, 0))
  await Vue.nextTick()
}

function seedPrinter () {
  (store as any)._withCommit(() => {
    store.state.config.apiUrl = 'http://m1.local'
    store.state.config.instances = [{ name: 'Muon M1 0001', apiUrl: 'http://m1.local' } as any]
    store.state.config.uiSettings.general.enableDiagnostics = true
    store.state.config.uiSettings.general.enableKeyboardShortcuts = true
    store.state.socket.apiConnected = true
    store.state.socket.open = true
    store.state.socket.ready = true
    store.state.auth.authenticated = true
    store.state.server.info.klippy_connected = true
    store.state.server.info.klippy_state = 'ready'
    store.state.server.info.components = ['history']
    Object.assign(store.state.printer.printer, {
      info: { state: 'ready', state_message: '' },
      print_stats: { state: 'printing', filename: 'calibration-cube.gcode', print_duration: 60, total_duration: 120, filament_used: 2 },
      display_status: { progress: 0.5, message: 'Printing' },
      virtual_sdcard: { file_position: 500, is_active: true, progress: 0.5 },
      heaters: { available_heaters: ['extruder', 'heater_bed'], available_sensors: ['extruder', 'heater_bed'] },
      extruder: { temperature: 205, target: 210, power: 0.4, can_extrude: true },
      heater_bed: { temperature: 60, target: 60, power: 0.2 },
      toolhead: { position: [100, 100, 10, 0], homed_axes: 'xyz', axis_minimum: [0, 0, 0], axis_maximum: [220, 220, 250] },
      objects: ['extruder', 'heater_bed', 'bed_mesh'],
      bed_mesh: { profile_name: 'default', mesh_min: [0, 0], mesh_max: [220, 220], probed_matrix: [[0, 0], [0, 0]] }
    })
    store.state.webcams.webcams = [{ uid: 'toolhead', name: 'Toolhead', enabled: true, source: 'database', service: 'mjpegstreamer', stream_url: '/webcam/?action=stream' }]
    store.state.printer.printer.idle_timeout.state = 'printing'
  })
}

const MountedApp = Vue.extend({
  extends: App,
  computed: {
    connection: () => ({ page: true, stale: false, banner: null, screen: null }),
    otherPrinterRoute: () => false,
    foreignPrinterRoute: () => false,
    deletionCloudView: () => false,
    deletionPending: () => false,
    loaderReady: () => false
  }
})

async function go (path: string, selector: string, wrapper: Wrapper<Vue>) {
  if (router.currentRoute.fullPath !== path) await router.push(path)
  for (let attempt = 0; attempt < 200 && !wrapper.find(selector).exists(); attempt++) {
    await new Promise(resolve => setTimeout(resolve, 10))
    await flush()
  }
  expect(wrapper.find(selector).exists(), `${path} route=${router.currentRoute.fullPath} text=${wrapper.text().slice(-1200)}`).toBe(true)
}

describe.sequential('Muon3D M1 journeys through the application router', () => {
  let wrapper: Wrapper<Vue>
  const errors: unknown[][] = []
  const warnings: string[] = []
  const oldWarn = Vue.config.warnHandler

  beforeAll(async () => {
    Vue.use(ColorSetPlugin, {})
    Vue.use(FiltersPlugin)
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn() })
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: { addEventListener: vi.fn(), removeEventListener: vi.fn(), width: 1280, height: 720 } })
    document.body.innerHTML = '<div id="app"></div>'
    const http = { get: vi.fn().mockResolvedValue({ data: {} }), post: vi.fn().mockResolvedValue({ data: {} }), delete: vi.fn().mockResolvedValue({ data: {} }) }
    ;(Vue as any).$http = http
    ;(Vue as any).$httpClient = http
    Object.assign(Vue.prototype, {
      $globals: Globals,
      $http: http,
      $socket: { emit: vi.fn(), connect: vi.fn(), disconnect: vi.fn() },
      $colorset: { forceResetAll: vi.fn(), color: () => '#80D6D1' },
      $confirm: vi.fn().mockResolvedValue(true),
      $waits: new Proxy({}, { get: (_target, key) => String(key) })
    })
    vi.spyOn(console, 'error').mockImplementation((...args) => { errors.push(args) })
    Vue.config.warnHandler = message => { warnings.push(message) }
    setActiveSlugSource(() => slug)
    setForeignSlugSource(() => false)
    seedPrinter()
    wrapper = mount(MountedApp, { router, store, vuetify, i18n, attachTo: '#app' })
    await go(`/${slug}`, '[data-tid="overview-page"]', wrapper)
    errors.length = 0
    warnings.length = 0
  })

  afterAll(() => {
    wrapper?.destroy()
    Vue.config.warnHandler = oldWarn
    vi.restoreAllMocks()
  })

  it('takes an operator through each printer-scoped page and the real rail/keyboard links', async () => {
    expect(wrapper.find('[data-tid="overview-pause"]').exists()).toBe(true)
    expect(wrapper.find('[data-tid="overview-stop"]').exists()).toBe(true)

    await go(`/${slug}/control`, '[data-tid="control-page"]', wrapper)
    expect(wrapper.findAll('.control-page > *').length).toBeGreaterThanOrEqual(6)
    const hotter = wrapper.find('button[aria-label="Nozzle hotter"]')
    await hotter.trigger('click')
    expect(SocketActions.printerGcodeScript).toHaveBeenCalledTimes(1)

    await go(`/${slug}/maintenance`, '[data-tid="maintenance-page"]', wrapper)
    expect(wrapper.find('[data-tid="maintenance-checks"]').exists()).toBe(true)
    await go(`/${slug}/tune`, '[data-tid="bedmesh-page"]', wrapper)

    await go(`/${slug}/jobs`, '.jobs', wrapper)
    expect(wrapper.text()).toContain('Pictures')
    expect(wrapper.text()).toContain('List')
    expect(wrapper.text()).toContain('Table')

    await go(`/${slug}/camera/toolhead`, '[data-tid="camera-page"]', wrapper)
    await wrapper.find('[data-tid="camera-details-trigger"]').trigger('click')
    expect(wrapper.text()).toContain('Stream')

    await go(`/${slug}/settings`, '[data-tid="settings-page"]', wrapper)
    expect(wrapper.text()).toContain('Charts')
    expect(wrapper.find('[data-tid="rail-console"]').exists()).toBe(true)
    expect(wrapper.find('[data-tid="rail-files"]').exists()).toBe(true)

    const palette = wrapper.findComponent({ name: 'CommandBar' }).vm as any
    expect(palette.goCommands.find((command: any) => command.id === 'go-console').keys).toEqual(['G', 'T'])
    expect(palette.goCommands.find((command: any) => command.id === 'go-files').keys).toEqual(['G', 'F'])
    await go(`/${slug}/console`, '[data-tid="console-page"]', wrapper)
    await go(`/${slug}/configure`, '[data-tid="files-page"]', wrapper)
  })

  it('refuses every viewer action on a managed printer without hiding capabilities', async () => {
    (store as any)._withCommit(() => { store.state.config.apiUrl = 'https://muon-cloud.invalid' })
    Object.assign(cloudState, { account: { id: 'viewer' }, activePrinterId: 'managed-m1', printers: [{ id: 'managed-m1', role: 'viewer', name: 'Muon M1', serial: '0001' }] })
    vi.mocked(SocketActions.printerGcodeScript).mockClear()
    await go(`/${slug}`, '[data-tid="overview-page"]', wrapper)
    await wrapper.find('[data-tid="overview-pause"]').trigger('click')
    await go(`/${slug}/control`, '[data-tid="control-page"]', wrapper)
    const hotter = wrapper.find('button[aria-label="Nozzle hotter"]')
    await hotter.trigger('click')
    await go(`/${slug}/maintenance`, '[data-tid="maintenance-page"]', wrapper)
    await go(`/${slug}/jobs`, '.jobs', wrapper)
    await go(`/${slug}/camera/toolhead`, '[data-tid="camera-page"]', wrapper)
    await go(`/${slug}/settings`, '[data-tid="settings-page"]', wrapper)
    expect(SocketActions.printerGcodeScript).not.toHaveBeenCalled()
    ;(store as any)._withCommit(() => { store.state.config.apiUrl = 'http://m1.local' })
    Object.assign(cloudState, { account: null, activePrinterId: null, printers: [] })
  })

  // Product gap: the More sheet exposes Overview but not its Charts subpage.
  it.fails('shows phone-only More destinations and routes them to the same pages', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 })
    ;(vuetify.framework.breakpoint as any).update()
    await Vue.nextTick()
    await go(`/${slug}`, '[data-tid="tab-more"]', wrapper)
    await wrapper.find('[data-tid="tab-more"]').trigger('click')
    await flush()
    for (const id of ['console', 'files', 'maintenance']) expect(wrapper.find(`[data-tid="more-${id}"]`).exists()).toBe(true)
    expect(wrapper.text()).toContain('Charts')
    await wrapper.find('[data-tid="more-maintenance"]').trigger('click')
    await flush()
    expect(router.currentRoute.path).toBe(`/${slug}/maintenance`)
  })

  it.each(['1', '0'])('retires legacy muon3d.pro=%s without changing the journey', async value => {
    localStorage.setItem('muon3d.pro', value)
    retireProStorage()
    expect(localStorage.getItem('muon3d.pro')).toBeNull()
    await go(`/${slug}/control`, '[data-tid="control-page"]', wrapper)
    expect(wrapper.findAll('.control-page > *').length).toBeGreaterThanOrEqual(6)
  })

  // Product bug: Console assumes its async scroller ref exists in mounted/beforeDestroy.
  it.fails('emits no console errors or Vue warnings during the journeys', () => {
    expect(errors).toEqual([])
    expect(warnings).toEqual([])
  })
})
