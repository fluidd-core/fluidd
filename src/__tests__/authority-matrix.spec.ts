import Vue from 'vue'
import { mount, shallowMount, type Wrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ControlMixin from '@/mixins/control'
import Overview from '@/views/Overview.vue'
import Jobs from '@/views/Jobs.vue'
import Camera from '@/views/Camera.vue'
import MaintenanceChecks from '@/components/maintenance/MaintenanceChecks.vue'
import SoftwareSettings from '@/components/settings/SoftwareSettings.vue'
import CommandBar from '@/components/layout/CommandBar.vue'
import { panelStore, panelStubs, waits } from '@/components/control/__tests__/panel-fixture'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'

const socket = vi.hoisted(() => ({
  printerGcodeScript: vi.fn(),
  printerPrintPause: vi.fn(),
  printerPrintCancel: vi.fn(),
  serverJobQueueStart: vi.fn(),
  machineUpdateClient: vi.fn(),
  printerRestart: vi.fn(),
  printerFirmwareRestart: vi.fn(),
  machineReboot: vi.fn(),
  machineShutdown: vi.fn(),
  serverFilesGetDirectory: vi.fn(),
  serverHistoryList: vi.fn(),
  serverHistoryTotals: vi.fn()
}))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/services/updates/watch', () => ({
  updateWatch: { status: null, remembered: null },
  currentOutcome: () => null,
  installStarted: vi.fn(),
  poll: vi.fn()
}))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'hazel', isForeignSlug: () => false, knownPrinters: () => [] }))
vi.mock('@/services/muon-cloud/directory', () => ({ savedName: () => 'Hazel' }))
vi.mock('@/services/slicer-bridge/slicerUrl', () => ({ slicerPresence: { state: 'absent' } }))

interface Fixture {
  wrapper: Wrapper<Vue>
  store: ReturnType<typeof panelStore>
  confirm: ReturnType<typeof vi.fn>
}

type CaseName = 'viewer' | 'operator' | 'disconnected' | 'klipper-not-ready'
interface MatrixRow {
  name: string
  command: keyof typeof socket
  mount: () => Fixture
  invoke: (fixture: Fixture) => unknown | Promise<unknown>
  control?: string
  needsKlipper?: boolean
  confirm?: boolean
}

function base (component: any, options: Record<string, any> = {}): Fixture {
  const { computed = {}, stubs = {}, ...rest } = options
  const store = panelStore()
  store.getters['server/componentSupport'] = () => true
  store.getters['config/getDisplayName'] = 'Hazel'
  store.getters['files/getRootFiles'] = () => []
  store.getters['macros/getVisibleMacros'] = []
  const confirm = vi.fn().mockResolvedValue(true)
  const wrapper = shallowMount(component, {
    mocks: {
      $store: store,
      $waits: waits,
      $confirm: confirm,
      $route: Vue.observable({ params: { printer: 'hazel' }, fullPath: '/hazel', meta: {} }),
      $router: { push: vi.fn().mockResolvedValue(undefined) },
      $vuetify: { breakpoint: { mdAndDown: false } }
    },
    computed: { isMobileViewport: () => false, ...computed },
    stubs: { ...panelStubs, 'router-link': true, ...stubs },
    ...rest
  })
  return { wrapper, store, confirm }
}

function controlHarness (): Fixture {
  const store = panelStore()
  store.getters['printer/getAllFans'] = [{ name: 'fan', type: 'fan', speed: 0, controllable: true }]
  store.getters['printer/getPins'] = [{ name: 'caselight', value: 0, pwm: true }]
  store.getters['macros/getMacros'] = [{ name: 'PARK', gcode: 'G1 X0', visible: true }]
  const confirm = vi.fn().mockResolvedValue(true)
  const wrapper = mount({ mixins: [ControlMixin], render (this: any, h: any) { return h('button', { attrs: { disabled: !this.controlReady } }, 'action') } }, {
    mocks: { $store: store, $waits: waits, $confirm: confirm, $route: { params: { printer: 'hazel' } } }
  })
  return { wrapper, store, confirm }
}

function overview (): Fixture {
  const fixture = base(Overview, { stubs: { 'overview-stage': true, 'overview-this-print': true, 'overview-tiles': true, 'overview-temps': true, 'overview-live-tune': true, 'overview-console': true, 'overview-quick-actions': true, 'control-macros': true, 'router-link': true } })
  fixture.store.getters['printer/getPrinterState'] = 'printing'
  fixture.store.state.printer.printer.print_stats = { filename: 'part.gcode', total_duration: 10 }
  return fixture
}

function jobs (): Fixture {
  const fixture = base(Jobs, {
    computed: { queue: () => [{ job_id: 'q1', filename: 'part.gcode' }], jobFiles: () => [], history: () => [], printerName: () => 'Hazel' },
    stubs: { 'job-detail': true, 'jobs-table': true, 'job-viewer': true, 'seg-picker': true, 'tone-pill': true, 'control-task-fold': true, 'router-link': true }
  })
  fixture.store.getters['server/componentSupport'] = () => true
  return fixture
}

function maintenance (): Fixture {
  const fixture = base(MaintenanceChecks, { computed: { checks: () => [{ id: 'shaper', title: 'Input shaper', gcode: 'SHAPER_CALIBRATE', wait: 'shaper', confirm: 'Run calibration?', status: { text: 'Due', tone: 'due', due: true } }], savePending: () => false } })
  fixture.store.getters['printer/getHomedAxes'] = () => true
  return fixture
}

function software (): Fixture {
  const fixture = base(SoftwareSettings, {
    computed: {
      printerName: () => 'Hazel',
      status: () => ({ update_available: true, current_version: '1', target_version: '2' }),
      unavailableText: () => '',
      others: () => [],
      enableNotifications: () => true,
      active: () => false,
      locked: () => false
    },
    stubs: { 'toggle-switch': true, 'task-fold': true, 'router-link': true }
  })
  Vue.set(fixture.store.state, 'version', { version_info: { MuonOS: { configured_type: 'ota' } }, busy: false })
  fixture.store.getters['config/getDisplayName'] = 'Hazel'
  return fixture
}

function palette (): Fixture {
  const fixture = base(CommandBar, {
    computed: { sectionContext: () => ({ foreign: false, camera: null }) },
    stubs: { 'v-dialog': { props: ['value'], template: '<div v-if="value"><slot /></div>' } }
  })
  fixture.store.getters['config/getDisplayName'] = 'Hazel'
  return fixture
}

const rows: MatrixRow[] = [
  { name: 'Overview / pause print', command: 'printerPrintPause', mount: overview, control: '[data-tid="overview-pause"]', invoke: f => (f.wrapper.vm as any).pauseCurrent() },
  { name: 'Overview / stop print', command: 'printerPrintCancel', mount: overview, control: '[data-tid="overview-stop"]', confirm: true, invoke: f => (f.wrapper.vm as any).stopCurrent() },
  { name: 'Control Move / home', command: 'printerGcodeScript', mount: controlHarness, control: 'button', invoke: f => (f.wrapper.vm as any).home() },
  { name: 'Control Heat / set nozzle', command: 'printerGcodeScript', mount: controlHarness, control: 'button', invoke: f => (f.wrapper.vm as any).setHeater((f.wrapper.vm as any).nozzle, 220) },
  { name: 'Control Speed / speed factor', command: 'printerGcodeScript', mount: controlHarness, control: 'button', invoke: f => (f.wrapper.vm as any).setSpeed(90) },
  { name: 'Control Filament / flow', command: 'printerGcodeScript', mount: controlHarness, control: 'button', invoke: f => (f.wrapper.vm as any).setFlow(95) },
  { name: 'Control Fans / fan output', command: 'printerGcodeScript', mount: controlHarness, control: 'button', invoke: f => (f.wrapper.vm as any).setFan((f.wrapper.vm as any).fans[0], 50) },
  { name: 'Control Macros / run macro', command: 'printerGcodeScript', mount: controlHarness, control: 'button', invoke: f => (f.wrapper.vm as any).sendTypedGcode('PARK') },
  { name: 'Control actions / restart', command: 'printerGcodeScript', mount: controlHarness, control: 'button', confirm: true, needsKlipper: false, invoke: f => (f.wrapper.vm as any).sendTypedGcode('RESTART') },
  { name: 'Maintenance / input-shaper calibration', command: 'printerGcodeScript', mount: maintenance, confirm: true, invoke: f => (f.wrapper.vm as any).runCheck((f.wrapper.vm as any).checks[0]) },
  { name: 'Jobs / start queue', command: 'serverJobQueueStart', mount: jobs, control: '[data-tid="jobs-queue-start"]', invoke: f => (f.wrapper.vm as any).startQueue() },
  { name: 'Camera / case light', command: 'printerGcodeScript', mount: () => { const f = base(Camera, { computed: { cameras: () => [], lightsPin: () => ({ name: 'caselight', value: 0, pwm: true }), hasLights: () => true }, stubs: { 'camera-item': true, 'camera-actions': true, 'router-link': true } }); return f }, invoke: f => (f.wrapper.vm as any).setLights(true) },
  { name: 'Settings / install MuonOS update', command: 'machineUpdateClient', mount: software, control: '[data-tid="software-install"]', confirm: true, needsKlipper: true, invoke: f => (f.wrapper.vm as any).install() },
  { name: 'Ctrl K / typed G-code', command: 'printerGcodeScript', mount: palette, invoke: async f => { await f.wrapper.setData({ open: true, query: '> M105' }); await (f.wrapper.vm as any).runAt(0) } }
]

function setCase (fixture: Fixture, name: CaseName) {
  const { store } = fixture
  store.state.config.apiUrl = 'https://muon-cloud.invalid'
  cloudState.activePrinterId = 'hazel'
  cloudState.printers = [{ id: 'hazel', name: 'Hazel', model: 'M1', version: 'test', linked_at: 0, last_seen: 0, online_since: null, online: true, role: name === 'viewer' ? 'viewer' : 'operator' }]
  printerTransportBinding.remote = true
  if (name === 'disconnected') store.getters['socket/getConnectionState'] = false
  if (name === 'klipper-not-ready') { store.getters['printer/getKlippyReady'] = false; store.getters['printer/getKlippyConnected'] = false }
}

async function runCase (row: MatrixRow, name: CaseName) {
  const fixture = row.mount()
  try {
    setCase(fixture, name)
    await Vue.nextTick()
    if (name === 'viewer' && row.control) {
      const button = fixture.wrapper.find(row.control)
      expect(button.exists(), `${row.name} [viewer]: control must render for its disabled-state assertion`).toBe(true)
      expect(button.attributes('disabled'), `${row.name} [viewer]: control is visibly enabled`).toBeDefined()
    }
    await row.invoke(fixture)
    const calls = socket[row.command].mock.calls.length
    const expected = name === 'operator' ? 1 : 0
    expect(calls, `${row.name} [${name}]: expected ${String(row.command)} ${expected} time(s), got ${calls}`).toBe(expected)
  } finally { fixture.wrapper.destroy() }
}

afterEach(() => {
  vi.clearAllMocks(); cloudState.account = null; cloudState.activePrinterId = null; cloudState.printers = []; printerTransportBinding.remote = false
})

describe('Control authority matrix', () => {
  for (const row of rows) {
    for (const scenario of ['viewer', 'operator', 'disconnected'] as const) {
      it(`${row.name} — ${scenario}`, async () => runCase(row, scenario))
    }
    if (row.needsKlipper !== false) it(`${row.name} — Klipper not ready`, async () => runCase(row, 'klipper-not-ready'))
    if (row.confirm) {
      for (const change of ['printer', 'account', 'role'] as const) {
        it(`${row.name} — ${change} changes during confirmation`, async () => {
          const fixture = row.mount(); setCase(fixture, 'operator')
          fixture.confirm.mockImplementation(async () => {
            if (change === 'printer') cloudState.activePrinterId = 'oak'
            if (change === 'account') cloudState.account = { id: 'other' } as any
            if (change === 'role') cloudState.printers[0].role = 'viewer'
            return true
          })
          try {
            await row.invoke(fixture)
            expect(socket[row.command], `${row.name} [confirmation/${change}]: command escaped stale confirmation`).not.toHaveBeenCalled()
          } finally { fixture.wrapper.destroy() }
        })
      }
    }
  }
})
