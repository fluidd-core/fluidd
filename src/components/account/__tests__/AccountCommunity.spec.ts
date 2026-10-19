import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AccountCommunity from '../AccountCommunity.vue'

const identity = vi.hoisted(() => vi.fn())
const saveIdentity = vi.hoisted(() => vi.fn())
const profile = vi.hoisted(() => vi.fn())
const claim = vi.hoisted(() => vi.fn())
vi.mock('@/services/account/community', () => ({ communityApi: { identity, saveIdentity, profile, claim } }))
vi.mock('@/services/muon-cloud/api', () => ({ storedToken: () => 'session' }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { account: { id: 'a1' } } }))
const settle = () => new Promise(resolve => setTimeout(resolve))
const setup = (age: number | null = null) => ({ declared_age: age, declared_at: age ? 1000 : null, can_community: age !== null, can_public: age === 18, identity_public: false, revision: 1, projection_pending: false })
const maker = () => ({ handle: 'ada', public_name: null, identity_public: false, can_public: false, can_community: true, page_on: false, bio: null })
function open () { return mount(AccountCommunity) }
describe('private community setup', () => {
  afterEach(() => { vi.resetAllMocks() })
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
    next.destroy()
  })
})
