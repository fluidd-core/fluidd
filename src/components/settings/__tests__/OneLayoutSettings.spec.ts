import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { proMode } from '@/services/pro-mode'
import GeneralSettings from '../GeneralSettings.vue'
import ThemeSettings from '../ThemeSettings.vue'
import SoftwareSettings from '../SoftwareSettings.vue'

afterEach(() => { proMode.on = false })

const commonStubs = {
  'v-text-field': true,
  'v-select': true,
  'v-combobox': true,
  'toggle-switch': true
}

function general (pro: boolean) {
  proMode.on = pro
  return shallowMount(GeneralSettings, {
    stubs: commonStubs,
    mocks: { $t: (key: string) => key, $rules: { required: true, lengthGreaterThanOrEqual: () => true }, $globals: { APP_NAME: 'Control' } },
    computed: {
      instanceName: () => 'M1', locale: () => 'default', supportedLocales: () => [],
      dateFormat: () => 'iso', timeFormat: () => '24h', availableDateFormats: () => [], availableTimeFormats: () => [],
      confirmOnEstop: () => false, hasPowerDevices: () => false, enableKeyboardShortcuts: () => true,
      showUploadAndPrint: () => true, showSaveConfigAndRestart: () => true, powerDevicesList: () => [],
      printProgressCalculation: () => ['file'], printEtaCalculation: () => ['file'],
      availablePrintProgressCalculation: () => [], availablePrintEtaCalculation: () => [],
      sectionsToIgnorePendingConfigurationChanges: () => [], enableDiagnostics: () => false,
      confirmOnSaveConfigAndRestart: () => true
    }
  })
}

describe('Settings in one layout', () => {
  it.each([false, true])('shows General task controls when legacy Pro is %s', pro => {
    const wrapper = general(pro)
    expect(wrapper.text()).toContain('Saving the config')
    expect(wrapper.text()).toContain('Upload and print')
    expect(wrapper.text()).toContain("A print's progress")
    expect(wrapper.text()).toContain('Config changes and diagnostics')
    wrapper.destroy()
  })

  it.each([false, true])('shows community themes when legacy Pro is %s', pro => {
    proMode.on = pro
    const wrapper = shallowMount(ThemeSettings, {
      stubs: { ...commonStubs, 'seg-picker': true, 'app-color-picker': true },
      mocks: { $t: (key: string) => key },
      computed: { theme: () => ({ color: '#fff', isDark: false, logo: { src: '' }, style: 'glass', backgroundLogo: false }), themePresets: () => [] }
    })
    expect(wrapper.text()).toContain('A community theme')
    wrapper.destroy()
  })

  it.each([false, true])('puts Other software in a closed task fold when legacy Pro is %s', async pro => {
    proMode.on = pro
    const wrapper = shallowMount(SoftwareSettings, {
      stubs: { 'toggle-switch': true, 'router-link': true },
      computed: {
        printerName: () => 'M1', status: () => null, unavailableText: () => 'Asking the printer…', enableNotifications: () => true,
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
})
