import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Admin from '../Admin.vue'
import * as api from '@/services/admin/client'

vi.mock('@/services/admin/client', () => ({
  adminAvailable: () => true,
  confirmStaff: vi.fn(),
  lookupAccount: vi.fn(),
  readAudit: vi.fn(),
  AdminError: class extends Error { expired = true }
}))
const mountPage = () => mount(Admin, { stubs: { RouterLink: { template: '<a><slot /></a>' } } })
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve() }
afterEach(() => { vi.clearAllMocks(); vi.useRealTimers() })

describe('staff read-only page', () => {
  it('lets staff start a new read when they switch sections during a request', async () => {
    vi.mocked(api.confirmStaff).mockResolvedValue({ actor: 'staff', staff_expires_at: Date.now() / 1000 + 120 })
    let answer!: (v: api.Lookup) => void
    vi.mocked(api.lookupAccount).mockImplementation(() => new Promise(resolve => { answer = resolve }))
    const w = mountPage()
    await w.get('[data-tid=admin-confirm]').trigger('click'); await settle()
    await w.get('input[name=query]').setValue('account-17')
    await w.get('textarea[name=reason]').setValue('Review case 1042')
    await w.get('form').trigger('submit'); await settle()
    const audit = w.findAll('nav button').at(1)
    await audit.trigger('click'); await settle()
    expect(w.get('[data-tid=admin-lookup]').attributes('disabled')).toBeUndefined()
    answer({ account: null, staff_expires_at: Date.now() / 1000 + 120 }); await settle()
    expect(w.text()).not.toContain('No account matched')
    w.destroy()
  })
  it('locks on cancel, then shows an exact result and clears it when confirmation expires', async () => {
    vi.useFakeTimers()
    vi.mocked(api.confirmStaff).mockRejectedValueOnce(new DOMException('Cancelled', 'NotAllowedError'))
      .mockResolvedValueOnce({ actor: 'staff', staff_expires_at: Date.now() / 1000 + 2 })
    vi.mocked(api.lookupAccount).mockResolvedValue({ account: { id: 'account-17', name: 'Sample person', email: 'fixture@example.test', email_verified: true, created_at: 1, delete_after: null, sessions: 2 }, staff_expires_at: Date.now() / 1000 + 2 })
    const w = mountPage()
    await w.get('[data-tid=admin-confirm]').trigger('click'); await settle()
    expect(w.text()).toContain('Confirmation cancelled')
    expect(w.find('[data-tid=admin-lookup]').exists()).toBe(false)
    await w.get('[data-tid=admin-confirm]').trigger('click'); await settle()
    await w.get('input[name=query]').setValue('account-17')
    await w.get('textarea[name=reason]').setValue('Review case 1042')
    await w.get('form').trigger('submit'); await settle()
    expect(w.text()).toContain('fixture@example.test')
    expect(w.text()).not.toContain('Suspend account')
    await vi.advanceTimersByTimeAsync(2100)
    expect(w.text()).not.toContain('fixture@example.test')
    expect(w.find('[data-tid=admin-lookup]').exists()).toBe(false)
    w.destroy()
  })
  it('does not apply a late lookup after the page has been locked', async () => {
    vi.useFakeTimers()
    vi.mocked(api.confirmStaff).mockResolvedValue({ actor: 'staff', staff_expires_at: Date.now() / 1000 + 1 })
    let answer!: (v: api.Lookup) => void
    vi.mocked(api.lookupAccount).mockImplementation(() => new Promise(resolve => { answer = resolve }))
    const w = mountPage()
    await w.get('[data-tid=admin-confirm]').trigger('click'); await settle()
    await w.get('input[name=query]').setValue('account-17')
    await w.get('textarea[name=reason]').setValue('Review case 1042')
    await w.get('form').trigger('submit'); await settle()
    await vi.advanceTimersByTimeAsync(1100)
    answer({ account: { id: 'late', name: 'Late identity', email: 'late@example.test', email_verified: true, created_at: 1, delete_after: null, sessions: 1 }, staff_expires_at: Date.now() / 1000 + 90 })
    await settle()
    expect(w.text()).not.toContain('late@example.test')
    w.destroy()
  })
})
