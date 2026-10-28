import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountPrinters from '../AccountPrinters.vue'
import { accountApi } from '@/services/account/api'
import { accountState } from '@/services/account/state'

vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { printers: [{ id: 'p1', name: 'Sample M1', model: 'M1', version: 'mock', online: false, online_since: null, last_seen: 1, shared: false, role: 'operator', linked_at: 1 }], status: {} }, refreshPrinters: async () => {} }))
vi.mock('@/services/account/state', () => ({ accountState: { approvals: [] }, loadApprovals: async () => {}, describe: (e: Error) => e.message }))
vi.mock('@/services/printer-pages', () => ({ knownPrinters: () => [] }))

const until = 1900000000
const share = { id: 's1', printer_id: 'p1', email: 'friend@example.test', role: 'operator', ends_at: until, created_at: 1 }
const invite = { id: 'i1', printer_id: 'p1', email: 'guest@example.test', role: 'viewer', ends_at: until, created_at: 1 }
const settle = () => new Promise(resolve => setTimeout(resolve))
let requests: Array<{ url: string, body: any }> = []

function open () {
  const currentShare = { ...share }
  const currentInvite = { ...invite }
  vi.stubGlobal('fetch', vi.fn(async (url, options) => {
    const body = options.body ? JSON.parse(options.body) : undefined
    requests.push({ url: String(url), body })
    if (body && String(url).endsWith('/shares')) Object.assign(currentShare, body)
    if (body && String(url).endsWith('/invites')) Object.assign(currentInvite, body)
    const result = String(url).endsWith('/shares')
      ? { shares: [currentShare], share: currentShare }
      : String(url).endsWith('/invites')
        ? { invites: [currentInvite], invite: currentInvite }
        : { links: [] }
    return new Response(JSON.stringify(result), { status: 200 })
  }))
  const w = mount(AccountPrinters, {
    propsData: { linkTo: (id: string) => '/account/' + id },
    stubs: {
      M3Dialog: { props: ['value', 'title'], template: '<div v-if="value"><h2>{{ title }}</h2><slot /><slot name="actions" /></div>' },
      'router-link': { template: '<a><slot /></a>' },
      'frame-icon': true,
      PrinterThumb: true,
      LinkPrinterDialog: true
    }
  })
  return w
}

describe('supported printer sharing follow-ups', () => {
  afterEach(() => { vi.unstubAllGlobals(); requests = []; accountState.approvals = [] })
  it('changes an existing share to Viewer while preserving its exact expiry', async () => {
    const w = open()
    await settle()
    const row = w.findAll('[data-tid="printers-person"]').at(0)
    const change = row.find('[data-tid="person-role"]')
    expect(change.exists()).toBe(true)
    await change.trigger('click')
    await w.find('[data-tid="role-viewer"]').trigger('click')
    await w.find('[data-tid="role-save"]').trigger('click')
    await settle()
    expect(requests.find(r => r.body?.role === 'viewer' && r.url.endsWith('/shares'))?.body).toEqual({ email: 'friend@example.test', role: 'viewer', ends_at: until })
    expect(w.text()).toContain('can now watch')
    expect(w.findAll('[data-tid="printers-person"]').at(0).text()).toContain('Viewer')
    w.destroy()
  })
  it('resends an existing invite with its original role and expiry', async () => {
    const w = open()
    await settle()
    const resend = w.find('[data-tid="invite-resend"]')
    expect(resend.exists()).toBe(true)
    await resend.trigger('click')
    await settle()
    expect(requests.find(r => r.body && r.url.endsWith('/invites'))?.body).toEqual({ email: 'guest@example.test', role: 'viewer', ends_at: until })
    expect(w.text()).toContain('Invitation sent')
    w.destroy()
  })
  it('renames a passkey with the confirmation the console requires', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url, options) => {
      requests.push({ url: String(url), body: JSON.parse(options.body) })
      return new Response(JSON.stringify({ id: 'key1', name: 'New name' }))
    }))
    await accountApi.renamePasskey('key1', 'New name', { password: 'test password', code: '123456' })
    expect(requests[0].body).toEqual({ name: 'New name', password: 'test password', code: '123456' })
  })

  it('approves the role the link requested without offering a role the approval API ignores', async () => {
    accountState.approvals = [{ id: 'approval1', kind: 'link_join', printer_id: 'p1', link_id: 'link1', role: 'operator', state: 'pending', requester: { email: 'waiting@example.test' }, created_at: 1, expires_at: 1900000000 }]
    const w = open()
    await settle()
    const request = w.find('[data-tid="printers-request"]')
    const allow = request.find('[data-tid="approval-allow"]')
    expect(allow.exists()).toBe(true)
    expect(allow.text()).toBe('Allow Operator')
    expect(request.text()).toContain('as an Operator')
    expect(request.findAll('select, [role="radio"]').length).toBe(0)
    await allow.trigger('click')
    await settle()
    expect(requests.find(r => r.url.endsWith('/approvals/approval1'))?.body).toEqual({ allow: true })
    w.destroy()
  })
})
