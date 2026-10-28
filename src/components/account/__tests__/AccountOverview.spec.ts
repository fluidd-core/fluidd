import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountOverview from '../AccountOverview.vue'
import { CREDITS_CATALOGUE } from '@/services/account/credits-catalogue'

const loadCredits = vi.hoisted(() => vi.fn(() => new Promise(() => {})))
vi.mock('@/services/account/credits', async (actual) => ({ ...(await actual<object>()), loadCredits }))
vi.mock('@/services/account/state', async (actual) => ({ ...(await actual<object>()), loadOverview: vi.fn() }))
vi.mock('@/services/library/store', async (actual) => ({
  ...(await actual<object>()),
  refreshLibrary: vi.fn(async () => {}),
  watchLibraryAccount: vi.fn()
}))

const shipped = CREDITS_CATALOGUE.planPageOpen

const overview = () => mount(AccountOverview, {
  propsData: { linkTo: (id: string) => `/account/${id}` },
  stubs: { 'frame-icon': true, 'printer-thumb': true, 'router-link': { template: '<a><slot /></a>' } }
})

describe('the Overview plan tile', () => {
  afterEach(() => {
    CREDITS_CATALOGUE.planPageOpen = shipped
    vi.clearAllMocks()
  })

  it('says plans are coming, and asks for no balance, while the Plan and credits page is closed', () => {
    CREDITS_CATALOGUE.planPageOpen = false
    const w = overview()
    const tile = w.find('[data-tid="account-tile-plan"]').text().replace(/\s+/g, ' ')
    expect(tile).toContain('Free plan')
    expect(tile).toContain('Printer features are always free')
    expect(tile).toContain('Plans soon')
    expect(loadCredits).not.toHaveBeenCalled()
    w.destroy()
  })

  it('reads the balance once the page is open', () => {
    CREDITS_CATALOGUE.planPageOpen = true
    const w = overview()
    expect(loadCredits).toHaveBeenCalledTimes(1)
    expect(w.find('[data-tid="account-tile-plan"]').text()).not.toContain('Plans soon')
    w.destroy()
  })
})
