import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import VueRouter from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SocketActions } from '@/api/socketActions'
import GeneralSettings from '../GeneralSettings.vue'
import ThemeSettings from '../ThemeSettings.vue'
import SoftwareSettings from '../SoftwareSettings.vue'
import Settings from '@/views/Settings.vue'

vi.mock('@/services/updates/watch', () => ({
  updateWatch: { status: null, remembered: null }, currentOutcome: () => null, installStarted: vi.fn(), poll: vi.fn()
}))
vi.mock('@/services/dev-mode/state', () => ({ devModeState: {}, refreshDevMode: vi.fn() }))

afterEach(() => { localStorage.setItem('muon3d.pro', '0') })

const commonStubs = {
  'v-text-field': true,
  'v-select': true,
  'v-combobox': true,
  'toggle-switch': true
}

function general (pro: boolean) {
  localStorage.setItem('muon3d.pro', pro ? '1' : '0')
  return shallowMount(GeneralSettings, {
    stubs: commonStubs,
    mocks: { $t: (key: string) => key, $rules: { required: true, lengthGreaterThanOrEqual: () => true }, $globals: { APP_NAME: 'Control' } },
    computed: {
      instanceName: () => 'M1',
      locale: () => 'default',
      supportedLocales: () => [],
      dateFormat: () => 'iso',
      timeFormat: () => '24h',
      availableDateFormats: () => [],
      availableTimeFormats: () => [],
      confirmOnEstop: () => false,
      hasPowerDevices: () => false,
      enableKeyboardShortcuts: () => true,
      showUploadAndPrint: () => true,
      showSaveConfigAndRestart: () => true,
      powerDevicesList: () => [],
      printProgressCalculation: () => ['file'],
      printEtaCalculation: () => ['file'],
      availablePrintProgressCalculation: () => [],
      availablePrintEtaCalculation: () => [],
      sectionsToIgnorePendingConfigurationChanges: () => [],
      enableDiagnostics: () => false,
      confirmOnSaveConfigAndRestart: () => true
    }
  })
}

describe('Settings in one layout', () => {
  it.each([false, true])('shows the same Settings sections when legacy Pro is %s', pro => {
    localStorage.setItem('muon3d.pro', pro ? '1' : '0')
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const router = new VueRouter({ mode: 'abstract', routes: [{ path: '/settings', name: 'Settings', component: Settings }] })
    router.push('/settings')
    const wrapper = shallowMount(Settings, {
      localVue,
      router,
      stubs: { 'router-link': true, 'router-view': true },
      mocks: {
        $store: {
          getters: { 'server/componentSupport': () => false, 'config/getDisplayName': 'M1', 'webcams/getWebcams': [], 'config/getTempPresets': [], 'macros/getMacros': [], 'version/hasUpdate': () => false },
          state: { version: { version_info: {} } }
        }
      },
      computed: { isMobileViewport: () => false }
    })
    expect((wrapper.vm as any).sections.map((section: any) => section.id)).toEqual([
      'general', 'network', 'cameras', 'materials', 'macros', 'console', 'files',
      'toolhead', 'gcodePreview', 'developer', 'system'
    ])
    wrapper.destroy()
  })

  it.each([false, true])('shows General task controls when legacy Pro is %s', pro => {
    const wrapper = general(pro)
    expect(wrapper.text()).toContain('Saving the config')
    expect(wrapper.text()).toContain('Upload and print')
    expect(wrapper.text()).toContain("A print's progress")
    expect(wrapper.text()).toContain('Config changes and diagnostics')
    expect(wrapper.findComponent({ name: 'TaskFold' }).find('.m3-sets').exists()).toBe(true)
    expect(wrapper.text()).toContain('These settings')
    wrapper.destroy()
  })

  it.each([false, true])('shows community themes when legacy Pro is %s', pro => {
    localStorage.setItem('muon3d.pro', pro ? '1' : '0')
    const wrapper = shallowMount(ThemeSettings, {
      stubs: { ...commonStubs, 'seg-picker': true, 'app-color-picker': true },
      mocks: { $t: (key: string) => key },
      computed: { theme: () => ({ color: '#fff', isDark: false, logo: { src: '' }, style: 'glass', backgroundLogo: false }), themePresets: () => [] }
    })
    expect(wrapper.text()).toContain('A community theme')
    wrapper.destroy()
  })

  it.each([false, true])('puts Other software in a closed task fold when legacy Pro is %s', async pro => {
    localStorage.setItem('muon3d.pro', pro ? '1' : '0')
    const wrapper = shallowMount(SoftwareSettings, {
      stubs: { 'toggle-switch': true, 'router-link': true },
      computed: {
        printerName: () => 'M1',
        status: () => null,
        unavailableText: () => 'Asking the printer…',
        enableNotifications: () => true,
        others: () => [{ key: 'moonraker', title: 'moonraker', text: 'Up to date', update: false }]
      }
    })
    const fold = wrapper.findComponent({ name: 'TaskFold' })
    expect(fold.exists()).toBe(true)
    expect(fold.props('title')).toBe('Other software')
    expect(fold.props('value')).toBe(false)
    expect(fold.text()).toContain('moonraker')
    wrapper.destroy()
  })

  it.each([
    ['viewer', false, true, false],
    ['disconnected session', true, false, false],
    ['printing printer', true, true, true]
  ])('refuses an Other software update for a %s', async (_case, control, connected, printing) => {
    const update = vi.spyOn(SocketActions, 'machineUpdateClient').mockImplementation(() => undefined as any)
    const confirm = vi.fn().mockResolvedValue(true)
    const wrapper = shallowMount(SoftwareSettings, {
      stubs: { 'toggle-switch': true, 'router-link': true },
      mocks: { $confirm: confirm, $store: { dispatch: vi.fn(), state: { version: { busy: false } } } },
      computed: { printerName: () => 'M1', status: () => null, unavailableText: () => '', others: () => [], enableNotifications: () => true, commandControlAvailable: () => control, klippyConnected: () => connected, printerPrinting: () => printing, printerPaused: () => false, printerState: () => printing ? 'printing' : 'standby' }
    })
    await (wrapper.vm as any).updateOther('moonraker')
    expect(confirm).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('confirms Other software updates and sends nothing when cancelled', async () => {
    const update = vi.spyOn(SocketActions, 'machineUpdateClient').mockImplementation(() => undefined as any)
    const confirm = vi.fn().mockResolvedValue(false)
    const dispatch = vi.fn()
    const wrapper = shallowMount(SoftwareSettings, {
      stubs: { 'toggle-switch': true, 'router-link': true },
      mocks: { $confirm: confirm, $store: { dispatch, state: { version: { busy: false } } } },
      computed: { printerName: () => 'M1', status: () => null, unavailableText: () => '', others: () => [], enableNotifications: () => true, commandTarget: () => 'same', commandControlAvailable: () => true, klippyConnected: () => true, printerPrinting: () => false, printerPaused: () => false, printerState: () => 'standby' }
    })
    await (wrapper.vm as any).updateOther('moonraker')
    expect(confirm).toHaveBeenCalledOnce()
    expect(update).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('rechecks access and printer state after confirming an Other software update', async () => {
    const state = Vue.observable({ control: true })
    const update = vi.spyOn(SocketActions, 'machineUpdateClient').mockImplementation(() => undefined as any)
    const confirm = vi.fn().mockImplementation(async () => {
      state.control = false
      await Vue.nextTick()
      return true
    })
    const dispatch = vi.fn()
    const wrapper = shallowMount(SoftwareSettings, {
      stubs: { 'toggle-switch': true, 'router-link': true },
      mocks: { $confirm: confirm, $store: { dispatch, state: { version: { busy: false } } } },
      computed: {
        printerName: () => 'M1',
        status: () => null,
        unavailableText: () => '',
        others: () => [],
        enableNotifications: () => true,
        commandTarget: () => 'same',
        commandControlAvailable: () => state.control,
        klippyConnected: () => true,
        printerPrinting: () => false,
        printerPaused: () => false,
        printerState: () => 'standby'
      }
    })
    await (wrapper.vm as any).updateOther('moonraker')
    expect(confirm).toHaveBeenCalledOnce()
    expect(update).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})
