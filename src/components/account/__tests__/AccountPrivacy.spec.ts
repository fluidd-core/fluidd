import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountPrivacy from '../AccountPrivacy.vue'

const { exportLibrary } = vi.hoisted(() => ({ exportLibrary: vi.fn() }))
vi.mock('@/services/library/export', () => ({ exportLibrary }))
vi.mock('@/services/account/state', () => ({ accountState: { me: null }, loadMe: async () => {}, describe: (e: Error) => e.message }))
vi.mock('@/services/account/api', () => ({ accountApi: { retention: async () => ({}) } }))
const mount = () => shallowMount(AccountPrivacy, { propsData: { linkTo: (id: string) => '/account/' + id }, stubs: { RouterLink: true } })
const tick = () => new Promise(resolve => setTimeout(resolve))
afterEach(() => { vi.clearAllMocks() })

describe('Library data export', () => {
  it('uses a native keyboard-operable button beside account data', () => {
    const w = mount(); const button = w.find('[data-tid="privacy-library-download"]')
    expect(button.element.tagName).toBe('BUTTON'); expect(button.attributes('type')).toBe('button'); expect(w.text()).toContain('archive'); w.destroy()
  })
  it('fits the narrow 390 px account viewport without horizontal overflow', () => {
    const previous = window.innerWidth; Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
    const w = mount(); expect(w.element.scrollWidth).toBeLessThanOrEqual(390); expect(w.findAll('.acct-row').length).toBeGreaterThan(0)
    w.destroy(); Object.defineProperty(window, 'innerWidth', { configurable: true, value: previous })
  })
  it('disables both downloads and cannot double-start while one runs', async () => {
    let finish!: () => void; exportLibrary.mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
    const w = mount(); const button = w.find('[data-tid="privacy-library-download"]'); await button.trigger('click'); await button.trigger('click')
    expect(exportLibrary).toHaveBeenCalledOnce(); expect(button.attributes('disabled')).toBe('disabled'); expect(button.text()).toContain('Downloading')
    finish(); await tick(); w.destroy()
  })
  it('announces progress and completion through a polite live region', async () => {
    exportLibrary.mockImplementation(async (_signal, progress) => { progress(1048576, 2097152); return null })
    const w = mount(); await w.find('[data-tid="privacy-library-download"]').trigger('click'); await tick()
    const status = w.find('[data-tid="privacy-download-status"]'); expect(status.attributes('aria-live')).toBe('polite'); expect(status.attributes('aria-atomic')).toBe('true'); expect(status.text()).toContain('ready'); w.destroy()
  })
  it('aborts an in-flight download when leaving the page', async () => {
    let signal!: AbortSignal; exportLibrary.mockImplementation((value) => { signal = value; return new Promise(() => {}) })
    const w = mount(); await w.find('[data-tid="privacy-library-download"]').trigger('click'); w.destroy(); expect(signal.aborted).toBe(true)
  })
  it('explains picker cancellation and never announces success', async () => {
    exportLibrary.mockRejectedValue(new DOMException('Cancelled', 'AbortError')); const w = mount(); await w.find('[data-tid="privacy-library-download"]').trigger('click'); await tick()
    expect(w.find('[role="alert"]').text()).toContain('cancelled'); expect(w.text()).not.toContain('archive is ready'); w.destroy()
  })
})
