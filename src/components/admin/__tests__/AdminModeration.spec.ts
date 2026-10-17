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
const confirmDecision = async (w: any) => { expect(w.get('[role=dialog]').attributes('aria-labelledby')).toBe('decision-title'); await w.get('[data-tid=decision-confirm]').trigger('click'); await settle() }
const detail: api.CaseDetail = { id: 'case-1', share_id: 'share-1', title: 'Chosen title', owner: 'owner', kind: 'report', state: 'hidden', version: 3, assignee: 'jack', at: 1, hidden_by: 'staff-a', events: [{ id: 1, actor: 'staff-a', kind: 'report', text: '<script>unsafe()</script>', at: 1 }] }
afterEach(() => { vi.clearAllMocks() })
describe('moderation review', () => {
  it('requires intentional source review before public approval', async () => {
    const publication = { licence: 'CC0-1.0', credit: null, manifest: 'a'.repeat(64), files: [{ id: 'file-1', role: 'project', size_bytes: 3, sha256: 'b'.repeat(64), format: '3mf', encoding: 'identity' }], reviewed_by: null, reviewed_version: null }
    vi.mocked(api.staffCommand).mockResolvedValueOnce({ cases: [detail] }).mockResolvedValueOnce({ case: { ...detail, kind: 'publication', state: 'open', publication } } as any)
    const w = mount(AdminModeration, { propsData: { section: 'queue', actor: 'staff-a' } })
    await w.get('textarea').setValue('Review case 1042'); await w.get('form').trigger('submit'); await settle()
    await w.findAll('article button').at(0).trigger('click'); await settle()
    expect(w.text()).toContain('Source review')
    const approve = w.findAll('button').wrappers.find(b => b.text().startsWith('Approve'))!
    expect(approve.attributes('disabled')).toBeDefined()
    expect(w.findAll('button').wrappers.some(b => b.text().includes('Fetch source'))).toBe(true)
    w.destroy()
  })
  it('can approve a reported pending publication after this reviewer accepted its source', async () => {
    const publication = { licence: 'CC0-1.0', credit: null, manifest: 'a'.repeat(64), files: [], reviewed_by: 'staff-a', reviewed_version: 3 }
    vi.mocked(api.staffCommand).mockResolvedValueOnce({ cases: [detail] }).mockResolvedValueOnce({ case: { ...detail, state: 'open', publication } } as any).mockResolvedValueOnce({})
    const w = mount(AdminModeration, { propsData: { section: 'queue', actor: 'staff-a' } })
    await w.get('textarea').setValue('Review reported submission'); await w.get('form').trigger('submit'); await settle()
    await w.findAll('article button').at(0).trigger('click'); await settle()
    const approve = w.findAll('button').wrappers.find(b => b.text().startsWith('Approve'))!
    expect(approve.attributes('disabled')).toBeUndefined()
    await approve.trigger('click'); await confirmDecision(w)
    expect(api.staffCommand).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'approve', target: 'case-1', version: 3 }), false, expect.any(Function))
    w.destroy()
  })
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
    await restore.trigger('click'); await confirmDecision(w)
    expect(w.text()).toContain('outcome is uncertain')
    expect(w.text()).toContain('Refresh')
    expect(api.staffCommand).toHaveBeenCalledTimes(3)
    expect(api.staffCommand).toHaveBeenLastCalledWith(expect.objectContaining({ action: 'restore', version: 3 }), false, expect.any(Function))
    let answer!: (v: api.CommandResult) => void
    vi.mocked(api.staffCommand).mockImplementationOnce(() => new Promise(resolve => { answer = resolve }))
    await w.get('form').trigger('submit'); await settle(); w.destroy(); answer({ cases: [] }); await settle()
    expect(w.emitted('spent')).toBeUndefined()
  })
  it('renders loading and an empty review queue in its live status', async () => {
    let answer!: (v: api.CommandResult) => void
    vi.mocked(api.staffCommand).mockImplementationOnce(() => new Promise(resolve => { answer = resolve }))
    const w = mount(AdminModeration, { propsData: { section: 'queue', actor: 'staff-a' } })
    await w.get('textarea').setValue('Review empty queue'); await w.get('form').trigger('submit')
    expect(w.get('[role=status]').text()).toBe('Loading…')
    answer({ cases: [] }); await settle()
    expect(w.get('[role=status]').text()).toBe('No work waiting.')
    w.destroy()
  })
  it('renders a version conflict without saving or retrying', async () => {
    vi.mocked(api.staffCommand).mockResolvedValueOnce({ cases: [detail] }).mockResolvedValueOnce({ case: { ...detail, hidden_by: 'staff-b' } }).mockRejectedValueOnce(new Error('This changed while you were reviewing it. Reload before deciding again.'))
    const w = mount(AdminModeration, { propsData: { section: 'queue', actor: 'staff-a' } })
    await w.get('textarea').setValue('Review changed case'); await w.get('form').trigger('submit'); await settle()
    await w.findAll('article button').at(0).trigger('click'); await settle()
    const restore = w.findAll('button').wrappers.find(b => b.text().startsWith('Restore'))!
    await restore.trigger('click'); await confirmDecision(w)
    expect(w.get('[role=status]').text()).toContain('This changed while you were reviewing it')
    expect(api.staffCommand).toHaveBeenCalledTimes(3)
    expect(w.emitted('spent')).toBeUndefined()
    w.destroy()
  })
})
