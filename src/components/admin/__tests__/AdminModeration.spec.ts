import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AdminModeration from '../AdminModeration.vue'
import * as api from '@/services/admin/client'
vi.mock('@/services/admin/client', () => ({
  newCommandId: () => '0123456789abcdef0123456789abcdef',
  isStaffMutation: (action: string) => !['queue', 'case', 'reservations'].includes(action),
  staffCommand: vi.fn(),
  AdminError: class extends Error { expired = false }
}))
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve() }
const detail: api.CaseDetail = { id: 'case-1', share_id: 'share-1', title: 'Chosen title', owner: 'owner', kind: 'report', state: 'hidden', version: 3, assignee: 'jack', at: 1, hidden_by: 'staff-a', events: [{ id: 1, actor: 'staff-a', kind: 'report', text: '<script>unsafe()</script>', at: 1 }] }
afterEach(() => { vi.clearAllMocks() })
describe('moderation review', () => {
  it('reads a case with its server version, escapes evidence and refuses self-restoration', async () => {
    vi.mocked(api.staffCommand).mockResolvedValueOnce({ cases: [detail] }).mockResolvedValueOnce({ case: detail })
    const w = mount(AdminModeration, { propsData: { section: 'queue', actor: 'staff-a' } })
    await w.get('textarea').setValue('Review case 1042')
    await w.get('form').trigger('submit'); await settle()
    await w.findAll('article button').at(0).trigger('click'); await settle()
    expect(w.text()).toContain('Version 3')
    expect(w.find('script').exists()).toBe(false)
    const restore = w.findAll('button').wrappers.find(b => b.text().startsWith('Restore'))!
    expect(restore.attributes('disabled')).toBeDefined()
    expect(api.staffCommand).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'case', target: 'case-1', reason: 'Review case 1042' }), false, expect.any(Function))
    w.destroy()
  })
  it('ignores late results after leaving and shows an uncertain outcome without retrying', async () => {
    vi.mocked(api.staffCommand).mockResolvedValueOnce({ cases: [detail] }).mockResolvedValueOnce({ case: { ...detail, hidden_by: 'staff-b' } }).mockRejectedValueOnce(new Error('The outcome is uncertain. Reload the case and audit before deciding again.'))
    const w = mount(AdminModeration, { propsData: { section: 'queue', actor: 'staff-a' } })
    await w.get('textarea').setValue('Review case 1042'); await w.get('form').trigger('submit'); await settle()
    await w.findAll('article button').at(0).trigger('click'); await settle()
    const restore = w.findAll('button').wrappers.find(b => b.text().startsWith('Restore'))!
    await restore.trigger('click'); await settle()
    expect(w.text()).toContain('outcome is uncertain')
    expect(api.staffCommand).toHaveBeenCalledTimes(3)
    expect(api.staffCommand).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'restore', version: 3 }), false, expect.any(Function))
    let answer!: (v: api.CommandResult) => void
    vi.mocked(api.staffCommand).mockImplementationOnce(() => new Promise(resolve => { answer = resolve }))
    await w.get('form').trigger('submit'); await settle(); w.destroy(); answer({ cases: [] }); await settle()
    expect(w.emitted('spent')).toBeUndefined()
  })
})
