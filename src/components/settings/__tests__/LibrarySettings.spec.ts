import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PROFILE_PROMISE } from '@/services/library/profile-promise'

vi.mock('@/services/library/store', async (original) => ({
  ...await original() as object,
  watchLibraryAccount: vi.fn(),
  refreshLibrary: vi.fn(async () => {}),
  turnLibraryOn: vi.fn(async () => {})
}))

// eslint-disable-next-line import/first
import { libraryState, resetLibrary, turnLibraryOn } from '@/services/library/store'
// eslint-disable-next-line import/first
import LibrarySettings from '../LibrarySettings.vue'
// eslint-disable-next-line import/first
import LibraryPageMixin from '@/mixins/library-page'

beforeEach(() => {
  vi.clearAllMocks()
  resetLibrary('fixture')
  Object.assign(libraryState, { checked: true, promiseVersion: '2026-10-13' })
})

describe('Library consent surfaces', () => {
  it('renders every prepared October line in Settings and sends that version', async () => {
    const wrapper = mount(LibrarySettings, { stubs: { 'frame-icon': true, 'cloud-account-dialog': true } })
    expect(wrapper.findAll('.lib-set__promise li').wrappers.map(line => line.text())).toEqual(PROFILE_PROMISE)
    await wrapper.find('[data-tid="library-turn-on"]').trigger('click')
    expect(turnLibraryOn).toHaveBeenCalledWith('2026-10-13')
    wrapper.destroy()
  })

  it('disables Settings consent for an unknown version', () => {
    libraryState.promiseVersion = '2099-01-01'
    const wrapper = mount(LibrarySettings, { stubs: { 'frame-icon': true, 'cloud-account-dialog': true } })
    expect(wrapper.find('.lib-set__promise').exists()).toBe(false)
    expect(wrapper.find('[data-tid="library-turn-on"]').attributes('disabled')).toBe('disabled')
    wrapper.destroy()
  })

  it('confirms the exact current text on the Library page before sending consent', async () => {
    const confirm = vi.fn(async (message: string) => Boolean(message))
    const page = { promise: { version: '2026-10-13', summary: `Keep your models in your account. ${PROFILE_PROMISE.join(' ')}` }, $confirm: confirm, act: (action: () => Promise<void>) => action() }
    await (LibraryPageMixin as any).options.methods.turnOn.call(page)
    expect(confirm.mock.calls[0][0]).toBe(page.promise.summary)
    expect(turnLibraryOn).toHaveBeenCalledWith('2026-10-13')
  })

  it('opens no confirmation on the Library page for an unknown version', async () => {
    const confirm = vi.fn()
    await (LibraryPageMixin as any).options.methods.turnOn.call({ promise: null, $confirm: confirm })
    expect(confirm).not.toHaveBeenCalled()
    expect(turnLibraryOn).not.toHaveBeenCalled()
  })
})
