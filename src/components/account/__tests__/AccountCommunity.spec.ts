import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountCommunity from '../AccountCommunity.vue'
import communitySource from '../AccountCommunity.vue?raw'

const identity = vi.hoisted(() => vi.fn())
const saveIdentity = vi.hoisted(() => vi.fn())
const profile = vi.hoisted(() => vi.fn())
const claim = vi.hoisted(() => vi.fn())
vi.mock('@/services/account/community', () => ({ communityApi: { identity, saveIdentity, profile, claim } }))
const auth = vi.hoisted(() => ({ token: 'session', state: { account: { id: 'a1' } as { id: string } | null } }))
vi.mock('@/services/muon-cloud/api', () => ({ storedToken: () => auth.token }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: auth.state }))
const settle = () => new Promise(resolve => setTimeout(resolve))
const setup = (age: number | null = null) => ({ declared_age: age, declared_at: age ? 1000 : null, can_community: age !== null, can_public: age === 18, identity_public: false, revision: 1, projection_pending: false })
const maker = () => ({ handle: 'ada', public_name: null, identity_public: false, can_public: false, can_community: true, page_on: false, bio: null })
function open () { return mount(AccountCommunity) }
describe('private community setup', () => {
  afterEach(() => { vi.resetAllMocks(); auth.token = 'session'; auth.state.account = { id: 'a1' } })
  it('asks age once without claiming a handle or revealing private identity', async () => {
    identity.mockResolvedValue(setup())
    const w = open(); await settle()
    expect(w.find('input[aria-label="Your age"]').exists()).toBe(true)
    expect(w.text()).toContain('Never shown on your profile')
    expect(profile).not.toHaveBeenCalled()
    expect(saveIdentity).not.toHaveBeenCalled()
    w.destroy()
  })
  it('keeps private defaults, cancels local handle edits and reports collisions', async () => {
    identity.mockResolvedValue(setup(18)); profile.mockResolvedValue(maker())
    const w = open(); await settle()
    expect(w.find('input[aria-label="Your age"]').exists()).toBe(false)
    expect(w.text()).toContain('Anonymous maker')
    await w.find('input[aria-label="Username"]').setValue('taken')
    await w.find('[data-tid="community-cancel"]').trigger('click')
    expect((w.find('input[aria-label="Username"]').element as HTMLInputElement).value).toBe('ada')
    claim.mockRejectedValue(new Error('This handle is not available.'))
    await w.find('input[aria-label="Username"]').setValue('taken')
    await w.find('[data-tid="community-claim"]').trigger('click'); await settle()
    expect(w.find('[role="alert"]').text()).toContain('not available')
    expect(w.find('a[href="https://library.muon3d.com/@taken"]').exists()).toBe(false)
    w.destroy()
  })
  it('shows pending privacy delivery and discards answers after unmount', async () => {
    let finish!: (v: ReturnType<typeof setup>) => void
    identity.mockReturnValue(new Promise(resolve => { finish = resolve }))
    const w = open(); w.destroy(); finish(setup(18)); await settle()
    expect(profile).not.toHaveBeenCalled()
    identity.mockResolvedValue({ ...setup(18), projection_pending: true }); profile.mockResolvedValue(maker())
    const next = open(); await settle()
    expect(next.text()).toContain('up to two minutes')
    expect(next.find('[role="status"][aria-live="polite"]').text()).toContain('Delivery pending')
    expect(next.find('[data-tid="community-refresh"]').exists()).toBe(true)
    next.destroy()
  })

  it.each(['12', '121', 'seventeen', '13.5'])("explains why age '%s' cannot be confirmed", async value => {
    identity.mockResolvedValue(setup())
    const w = open(); await settle()
    const age = w.find('[data-tid="community-age"]')
    await age.setValue(value); await age.trigger('blur')
    expect(age.attributes('aria-describedby')).toContain('community-age-error')
    expect(w.find('#community-age-error[role="alert"]').text()).toContain(value === 'seventeen' || value === '13.5' ? 'whole number' : 'between 13 and 120')
    expect(saveIdentity).not.toHaveBeenCalled()
    w.destroy()
  })

  it('never invites a second age declaration after a 409', async () => {
    identity.mockResolvedValueOnce(setup()).mockResolvedValueOnce(setup(18))
    saveIdentity.mockRejectedValueOnce(Object.assign(new Error('Age was already declared.'), { status: 409 }))
    profile.mockResolvedValue(maker())
    const w = open(); await settle()
    await w.find('[data-tid="community-age"]').setValue('18')
    await w.find('[data-tid="community-confirm-age"]').trigger('click'); await settle(); await settle()
    expect(identity).toHaveBeenCalledTimes(2)
    expect(w.find('[data-tid="community-age"]').exists()).toBe(false)
    expect(w.text()).toContain('Age confirmed privately')
    w.destroy()
  })

  it('labels fields and errors, validates handles, and reports a network refusal', async () => {
    identity.mockResolvedValue(setup(18)); profile.mockResolvedValue(maker())
    const w = open(); await settle()
    const handle = w.find('[data-tid="community-handle"]')
    expect(handle.attributes('aria-describedby')).toContain('community-handle-help')
    await handle.setValue('bad handle!'); await handle.trigger('blur')
    expect(w.find('#community-handle-error').text()).toContain('letters, digits, dots or underscores')
    expect(claim).not.toHaveBeenCalled()
    claim.mockRejectedValueOnce(new Error("Your Library can't be reached. Check this computer's internet connection."))
    await handle.setValue('valid.handle')
    await w.find('[data-tid="community-claim"]').trigger('click'); await settle()
    expect(w.find('[role="alert"][aria-live="assertive"]').text()).toContain("can't be reached")
    w.destroy()
  })

  it('stops edits and announces when the account signs out', async () => {
    identity.mockResolvedValue(setup(18)); profile.mockResolvedValue(maker())
    const w = open(); await settle()
    auth.token = ''; auth.state.account = null
    await (w.vm as any).sessionChanged(); await w.vm.$nextTick()
    expect(w.find('[data-tid="community-signed-out"][role="status"]').text()).toContain('signed out')
    expect(w.find('[data-tid="community-handle"]').exists()).toBe(false)
    w.destroy()
  })

  it('gives the identity card and its fields explicit shrink and wrapping rules', async () => {
    identity.mockResolvedValue(setup(18)); profile.mockResolvedValue(maker())
    const w = open(); await settle()
    expect(w.find('.acct-card').classes()).toContain('account-community')
    expect(communitySource).toMatch(/\.account-community\s*\{[^}]*min-width:\s*0;[^}]*max-width:\s*100%;[^}]*overflow-wrap:\s*anywhere;/)
    expect(communitySource).toMatch(/\.account-community input, \.account-community select\s*\{[^}]*min-width:\s*0;[^}]*max-width:\s*100%;/)
    w.destroy()
  })
})
