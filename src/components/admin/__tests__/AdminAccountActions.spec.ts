import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import AdminAccountActions from '../AdminAccountActions.vue'
import * as api from '@/services/admin/client'
vi.mock('@/services/admin/client', () => ({ newCommandId: () => '0123456789abcdef0123456789abcdef', staffCommand: vi.fn(), AdminError: class extends Error { expired = false } }))
const settle = async () => { for (let i = 0; i < 10; i++) await Promise.resolve() }
afterEach(() => { vi.clearAllMocks() })
it('separates staff restoration from deletion cancellation and sends the read version', async () => {
  const account: api.AdminAccount = { id: 'target', name: 'Maker', email: 'fixture@example.test', email_verified: true, created_at: 1, sessions: 0, delete_after: 100, admin_version: 4, staff_suspended: true }
  vi.mocked(api.staffCommand).mockResolvedValue({ account: { id: 'target' } })
  const w = mount(AdminAccountActions, { propsData: { account } })
  expect(w.text()).not.toContain('Schedule deletion')
  expect(w.text()).toContain('cancel deletion')
  await w.get('textarea').setValue('Review case 1042')
  const restore = w.findAll('button').wrappers.find(b => b.text().startsWith('Restore'))!
  await restore.trigger('click')
  expect(w.get('[role=dialog]').attributes('aria-labelledby')).toBe('account-action-title')
  await w.get('[data-tid=account-action-confirm]').trigger('click'); await settle()
  expect(api.staffCommand).toHaveBeenCalledWith(expect.objectContaining({ action: 'restore-account', version: 4, target: 'target' }), true, expect.any(Function))
  expect(w.emitted('spent')?.length).toBe(1)
  w.destroy()
})
