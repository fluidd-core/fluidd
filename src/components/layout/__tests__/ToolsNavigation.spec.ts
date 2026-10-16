import { afterEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AppRail from '../AppRail.vue'
import AppTabBar from '../AppTabBar.vue'
import CommandBar from '../CommandBar.vue'
import { sectionOf, type SectionContext } from '@/router/printerSections'

// Keep printer discovery, connection setup and account UI outside these navigation tests.
vi.mock('@/api/socketActions', () => ({ SocketActions: {} }))
vi.mock('@/services/printer-pages', () => ({
  activeSlug: () => 'hazel-1234',
  isForeignSlug: () => false,
  knownPrinters: () => []
}))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { account: null, activePrinterId: null } }))
vi.mock('@/services/muon-cloud/directory', () => ({ hostOf: () => 'hazel.local' }))
vi.mock('@/services/slicer-bridge/slicerUrl', () => ({ probeSlicer: () => Promise.resolve(false) }))
vi.mock('../NetworkQuickMenu.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/muon-cloud/CloudAccountMenu.vue', () => ({ default: { template: '<div />' } }))

const native: SectionContext = { slicer: false, camera: null, history: true, timelapse: false, diagnostics: false, foreign: false }
const link = { props: ['to'], template: '<a :href="to" @click.prevent><slot /></a>' }
const sheet = { props: ['value'], template: '<div v-if="value"><slot /></div>' }

function show (component: typeof AppRail | typeof AppTabBar | typeof CommandBar, context = native, compact = false, fullPath = '/hazel-1234/configure') {
  return shallowMount(component, {
    computed: {
      sectionContext: () => context,
      currentSection: () => sectionOf('/configure'),
      isMobileViewport: () => compact,
      compact: () => compact
    },
    mocks: {
      $store: {
        state: { config: { apiUrl: '', uiSettings: { general: { enableKeyboardShortcuts: true } } } },
        getters: { 'socket/getConnectionState': false, 'auth/getAuthenticated': false }
      },
      $route: { name: 'Configure', path: fullPath, fullPath, params: { printer: 'hazel-1234' } },
      $router: { push: vi.fn().mockResolvedValue(undefined) },
      $vuetify: { breakpoint: { mdAndDown: compact } },
      $globals: { RAIL_WIDTH: 232, RAIL_WIDTH_COMPACT: 72 }
    },
    stubs: {
      'router-link': link,
      'v-navigation-drawer': { template: '<div><slot /></div>' },
      'v-bottom-sheet': sheet,
      'v-dialog': sheet,
      NetworkQuickMenu: true,
      CloudAccountMenu: true
    }
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Tools navigation', () => {
  it.each([AppTabBar, CommandBar])('%s renders no Pro switch or command', async component => {
    const wrapper = show(component)
    if (component === AppTabBar) await wrapper.find('[data-tid="tab-more"]').trigger('click')
    if (component === CommandBar) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-tid="command-bar"]').exists()).toBe(true)
      expect((wrapper.vm as CommandBar).results.every(command => !/pro/i.test(`${command.id} ${command.label}`))).toBe(true)
    }
    expect(wrapper.find('[data-tid="pro-switch"]').exists()).toBe(false)
    expect(wrapper.find('[data-tid="more-pro"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Turn Pro')
    expect(wrapper.text()).not.toContain('Pro controls')
    wrapper.destroy()
  })

  it.each([false, true])('keeps scoped tool links and the active page in the rail (compact: %s)', compact => {
    const wrapper = show(AppRail, native, compact)
    const files = wrapper.find('[data-tid="rail-files"]')
    expect(files.exists()).toBe(true)
    expect(files.props('to')).toBe('/hazel-1234/configure')
    expect(files.props('active')).toBe(true)
    expect(wrapper.find('[data-tid="rail-console"]').props('to')).toBe('/hazel-1234/console')
    if (!compact) expect(wrapper.text()).toContain('Tools')
    wrapper.destroy()
  })

  it('puts Tools in phone More and closes the sheet when a tool is chosen', async () => {
    const wrapper = show(AppTabBar)
    await wrapper.find('[data-tid="tab-more"]').trigger('click')
    expect(wrapper.text()).toContain('Tools')
    const files = wrapper.find('[data-tid="more-files"]')
    expect(files.attributes('href')).toBe('/hazel-1234/configure')
    expect(files.classes()).toContain('app-more__row--on')
    expect(wrapper.find('[data-tid="more-console"]').attributes('href')).toBe('/hazel-1234/console')
    expect(wrapper.find('[data-tid="tab-console"]').exists()).toBe(false)
    await files.trigger('click')
    expect(wrapper.find('[data-tid="more-files"]').exists()).toBe(false)
    wrapper.destroy()
  })

  it.each(['console', 'files'])('opens %s from the palette', async id => {
    const wrapper = show(CommandBar, native, false, '/hazel-1234')
    const command = (wrapper.vm as CommandBar).goCommands.find(c => c.id === `go-${id}`)!
    expect(command.keys).toEqual(['G', id === 'console' ? 'T' : 'F'])
    expect(command.hint).toBeUndefined()
    await command.run()
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith(`/hazel-1234/${id === 'console' ? 'console' : 'configure'}`)
    wrapper.destroy()
  })

  it('never offers native tools on a foreign printer in either navigation', async () => {
    const context = { ...native, foreign: true }
    const rail = show(AppRail, context)
    expect(rail.text()).not.toContain('Tools')
    expect(rail.find('[data-tid="rail-console"]').exists()).toBe(false)
    expect(rail.find('[data-tid="rail-files"]').exists()).toBe(false)
    rail.destroy()
    const phone = show(AppTabBar, context)
    await phone.find('[data-tid="tab-more"]').trigger('click')
    expect(phone.text()).not.toContain('Tools')
    expect(phone.find('[data-tid="more-console"]').exists()).toBe(false)
    expect(phone.find('[data-tid="more-files"]').exists()).toBe(false)
    phone.destroy()
  })
})
