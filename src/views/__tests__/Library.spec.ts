import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/muon-cloud/state', async () => {
  const { default: Vue } = await import('vue')
  return { cloudState: Vue.observable({ ready: true, account: null, activePrinterId: null, printers: [] }), cloudPrinterConnection: vi.fn() }
})
vi.mock('@/services/muon-cloud/api', async (original) => ({
  ...await original() as object,
  storedToken: vi.fn(() => null)
}))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => null }))
vi.mock('@/services/library/print-on', () => ({
  activePrinterFacts: vi.fn(),
  downloadGcode: vi.fn(),
  downloadProject: vi.fn(),
  gcodeFileName: vi.fn(),
  saveToComputer: vi.fn()
}))
vi.mock('@/components/library/PrintOnDialog.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/widgets/filesystem/FileNameDialog.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/muon-cloud/CloudAccountDialog.vue', () => ({ default: { render: () => null } }))

vi.mock('@/services/library/store', async (original) => ({
  ...await original() as object,
  watchLibraryAccount: vi.fn(),
  refreshLibrary: vi.fn(async () => {})
}))

// eslint-disable-next-line import/first
import { libraryState, resetLibrary, refreshLibrary } from '@/services/library/store'
// eslint-disable-next-line import/first
import { storedToken } from '@/services/muon-cloud/api'
// eslint-disable-next-line import/first
import { cloudState } from '@/services/muon-cloud/state'
// eslint-disable-next-line import/first
import Library from '../Library.vue'

function renderLibrary (query: Record<string, string> = {}) {
  return shallowMount(Library, {
    mocks: {
      $route: { query },
      $store: { state: { config: { apiUrl: '', instances: [] } }, getters: {} },
      $vuetify: { breakpoint: { mobile: false } }
    },
    stubs: ['router-link', 'frame-icon', 'library-card', 'library-recent-card', 'print-on-dialog', 'file-name-dialog', 'cloud-account-dialog']
  })
}

beforeEach(() => {
  resetLibrary('fixture')
  Object.assign(libraryState, { checked: true, enabled: true })
  vi.clearAllMocks()
})

describe('Library feed states', () => {
  it('shows an error without the off panel when the Library is disabled', () => {
    Object.assign(libraryState, {
      enabled: false,
      synced: false,
      errorCode: 'consent_required',
      error: 'Sign in again.'
    })
    const wrapper = renderLibrary()
    try {
      expect(wrapper.text()).toContain('Sign in again.')
      expect(wrapper.find('[data-tid="library-off"]').exists()).toBe(false)
      expect(wrapper.find('[data-tid="library-turn-on"]').exists()).toBe(false)
    } finally {
      wrapper.destroy()
    }
  })

  it.each([
    ['not-signed-in', 'Sign in again.'],
    ['offline', "Your Library can't be reached. Check this computer's internet connection."],
    ['service_unavailable', 'Preferences unavailable']
  ])('shows %s errors after the status check and allows a retry', async (errorCode, error) => {
    Object.assign(libraryState, { errorCode, error, synced: errorCode === 'service_unavailable' })
    const wrapper = renderLibrary()
    try {
      expect(wrapper.text()).toContain(error)
      expect(wrapper.text()).not.toContain('Nothing here yet')
      const retry = wrapper.findAll('button').wrappers.find(button => button.text() === 'Try again')
      expect(retry).toBeDefined()
      vi.mocked(refreshLibrary).mockClear()
      await retry!.trigger('click')
      expect(refreshLibrary).toHaveBeenCalledOnce()
    } finally {
      wrapper.destroy()
    }
  })

  it('shows loading while the first feed is pending', () => {
    const wrapper = renderLibrary()
    try {
      expect(wrapper.text()).toContain('Reading your Library…')
      expect(wrapper.text()).not.toContain('Nothing here yet')
    } finally {
      wrapper.destroy()
    }
  })

  it('keeps existing cards visible alongside a refresh error', () => {
    libraryState.synced = true
    libraryState.items = {
      existing: {
        id: 'existing',
        kind: 'plate',
        format: '3mf',
        name: 'Existing print',
        size_bytes: 10,
        has_thumbnail: false,
        state: 'ready',
        rev: 1,
        created_at: '2026-10-12T10:00:00Z',
        updated_at: '2026-10-12T10:00:00Z',
        deleted_at: null,
        versioned: true
      }
    }
    libraryState.error = 'Offline'
    const wrapper = renderLibrary()
    try {
      expect(wrapper.text()).toContain('Offline')
      expect(wrapper.text()).toContain('Try again')
      expect(wrapper.find('[data-tid="library-grid"]').exists()).toBe(true)
      expect(wrapper.find('library-card-stub').props('item').id).toBe('existing')
      expect(wrapper.text()).not.toContain('Nothing here yet')
    } finally {
      wrapper.destroy()
    }
  })

  it('shows the existing empty state after a genuinely empty successful feed', () => {
    libraryState.synced = true
    const wrapper = renderLibrary()
    try {
      expect(wrapper.text()).toContain('Nothing here yet')
      expect(wrapper.text()).toContain('Open Slice')
      expect(wrapper.text()).not.toContain('Reading your Library…')
    } finally {
      wrapper.destroy()
    }
  })
})

describe('Library: Discover and Your Library (KAN-735)', () => {
  it('opens on Your Library once signed in, and on Discover signed out', () => {
    const mine = renderLibrary()
    try {
      expect(mine.find('[data-tid="library-view-mine"]').attributes('aria-current')).toBe('page')
      expect(mine.find('[data-tid="library-view-discover"]').attributes('aria-current')).toBeUndefined()
      expect(mine.findComponent({ name: 'LibraryDiscover' }).exists()).toBe(false)
    } finally {
      mine.destroy()
    }
    Object.assign(libraryState, { account: null })
    const signedOut = renderLibrary()
    try {
      expect(signedOut.findComponent({ name: 'LibraryDiscover' }).exists()).toBe(true)
      expect(signedOut.find('[data-tid="library-signed-out"]').exists()).toBe(false)
    } finally {
      signedOut.destroy()
    }
  })

  it('stays on Your Library while a saved session is still being restored', () => {
    Object.assign(libraryState, { account: null })
    cloudState.ready = false
    vi.mocked(storedToken).mockReturnValue('saved')
    const restoring = renderLibrary()
    try {
      expect(restoring.findComponent({ name: 'LibraryDiscover' }).exists()).toBe(false)
    } finally {
      restoring.destroy()
      cloudState.ready = true
      vi.mocked(storedToken).mockReturnValue(null)
    }
  })

  it('follows the address: ?view=discover or ?view=mine', () => {
    const discover = renderLibrary({ view: 'discover' })
    try {
      expect(discover.findComponent({ name: 'LibraryDiscover' }).exists()).toBe(true)
      expect(discover.find('[data-tid="library-grid"]').exists()).toBe(false)
    } finally {
      discover.destroy()
    }
    Object.assign(libraryState, { account: null })
    const mine = renderLibrary({ view: 'mine' })
    try {
      expect(mine.findComponent({ name: 'LibraryDiscover' }).exists()).toBe(false)
      expect(mine.find('[data-tid="library-signed-out"]').exists()).toBe(true)
    } finally {
      mine.destroy()
    }
  })
})
