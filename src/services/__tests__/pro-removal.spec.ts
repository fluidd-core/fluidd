import { describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import { retireProStorage } from '@/services/retired-storage'
import App from '@/App.vue'
import router from '@/router'
import appBarSource from '@/components/layout/AppBar.vue?raw'
import appTabBarSource from '@/components/layout/AppTabBar.vue?raw'
import commandBarSource from '@/components/layout/CommandBar.vue?raw'

const firstPartyModules = import.meta.glob('../../**/*.{ts,vue}', {
  eager: true,
  import: 'default',
  query: '?raw'
}) as Record<string, string>

describe('retired Pro mode', () => {
  it('has no first-party module importing pro-mode', () => {
    const readers = Object.entries(firstPartyModules)
      .filter(([path, source]) => !path.includes('/slicer-bridge/vendor/') && /from ['"](?:@\/services|\.{1,2}\/[^'"]*)\/pro-mode['"]/.test(source))
      .map(([path]) => path)
    expect(readers).toEqual([])
  })

  it.each(['0', '1'])('retires the old storage value %s without reading it', value => {
    localStorage.setItem('muon3d.pro', value)
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    retireProStorage()
    expect(getItem).not.toHaveBeenCalledWith('muon3d.pro')
    getItem.mockRestore()
    expect(localStorage.getItem('muon3d.pro')).toBeNull()
  })

  it('does not stop startup when storage refuses removal', () => {
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('storage denied') })
    expect(() => retireProStorage()).not.toThrow()
    expect(removeItem).toHaveBeenCalledWith('muon3d.pro')
  })

  it('leaves Shift X unbound in the mounted app', async () => {
    const MountedApp = Vue.extend({
      extends: App,
      computed: {
        enableKeyboardShortcuts: () => true,
        connection: () => ({ stale: false }),
        foreignPrinterRoute: () => true,
        loaderReady: () => false
      },
      render: h => h('div')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const getters = new Proxy<Record<string, unknown>>({}, { get: (target, key: string) => target[key] ?? false })
    getters['config/getCustomThemeFile'] = () => null
    getters['printer/getPrintProgress'] = 0
    const wrapper = shallowMount(MountedApp, {
      router,
      mocks: {
        $store: { getters, state: { config: { uiSettings: { general: { enableKeyboardShortcuts: true } } }, printer: { printer: null } } }
      }
    })
    setItem.mockClear()
    const event = new KeyboardEvent('keydown', { key: 'X', shiftKey: true, cancelable: true })
    window.dispatchEvent(event)
    await wrapper.vm.$nextTick()
    expect(event.defaultPrevented).toBe(false)
    expect(setItem).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it.each([
    ['AppBar', appBarSource],
    ['AppTabBar', appTabBarSource],
    ['CommandBar', commandBarSource]
  ])('%s contains no Pro switch', (_name, source) => {
    expect(source).not.toMatch(/pro-switch|more-pro|Turn Pro|Pro controls/)
  })
})
