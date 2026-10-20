import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/muon-cloud/state', async () => {
  const { default: Vue } = await import('vue')
  return { cloudState: Vue.observable({ account: null, activePrinterId: null, printers: [] }), cloudPrinterConnection: vi.fn() }
})
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
import Library from '../Library.vue'

function renderLibrary () {
  return shallowMount(Library, {
    mocks: {
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
        id: 'existing', kind: 'plate', format: '3mf', name: 'Existing print', size_bytes: 10,
        has_thumbnail: false, state: 'ready', rev: 1, created_at: '2026-10-12T10:00:00Z',
        updated_at: '2026-10-12T10:00:00Z', deleted_at: null, versioned: true
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
