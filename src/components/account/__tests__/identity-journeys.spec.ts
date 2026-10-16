import { mount, shallowMount, type Wrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import AccountCommunity from '../AccountCommunity.vue'
import SignIn from '@/views/SignIn.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { modelsAssertion } from '@/services/library/assertion'

type Identity = {
  declared_age: number | null;
  declared_at: number | null;
  can_community: boolean;
  can_public: boolean;
  identity_public: boolean;
  revision: number;
  projection_pending: boolean;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' }
})
const settle = () => new Promise(resolve => setTimeout(resolve))

/** One deliberately stateful stand-in for both the account console and models service. */
class FakeConsole {
  identity: Identity = this.identityFor(null, false)
  deliveredPublic = false
  handle = 'maker.one'
  pageOn = true
  accountCreated = false
  signupBody: Record<string, unknown> | null = null
  failNextHandle = false

  identityFor (age: number | null, publicIdentity: boolean): Identity {
    return {
      declared_age: age,
      declared_at: age === null ? null : 1_700_000_000,
      can_community: age !== null,
      can_public: age !== null && age >= 18,
      identity_public: publicIdentity,
      revision: 1,
      projection_pending: false
    }
  }

  profile () {
    return {
      handle: this.handle,
      public_name: 'Ada Maker',
      identity_public: this.deliveredPublic,
      can_public: this.identity.can_public,
      can_community: this.identity.can_community,
      page_on: this.pageOn,
      bio: null
    }
  }

  acknowledge () {
    this.deliveredPublic = this.identity.identity_public
    this.identity.projection_pending = false
  }

  async fetch (input: string | URL | Request, init: RequestInit = {}) {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    const method = init.method ?? 'GET'
    const body = init.body ? JSON.parse(String(init.body)) : {}
    if (url.pathname === '/v1/auth/sign-up' && method === 'POST') {
      this.accountCreated = true
      this.signupBody = body
      this.identity = this.identityFor(body.declared_age, false)
      return json({ token: 'signup-session', account: { id: 'account-1' } })
    }
    if (url.pathname === '/v1/handoff' && method === 'POST') return json({ code: 'handoff-1', url: 'https://control.test/handoff', expires_at: 1_800_000_000 })
    if (url.pathname === '/v1/auth/sign-out' && method === 'POST') return json({ ok: true })
    if (url.pathname === '/v1/me/community-identity' && method === 'GET') return json(this.identity)
    if (url.pathname === '/v1/me/community-identity' && method === 'PATCH') {
      if (body.declared_age !== undefined) {
        if (this.identity.declared_age !== null) return json({ error: 'age was already declared' }, 409)
        this.identity = this.identityFor(body.declared_age, false)
      }
      if (body.identity_public !== undefined) {
        this.identity.identity_public = body.identity_public
        this.identity.projection_pending = this.deliveredPublic !== body.identity_public
        this.identity.revision++
      }
      return json(this.identity)
    }
    if (url.pathname === '/v1/me/assertion' && method === 'POST') return json({ assertion: 'models-proof', expires_at: 1_800_000_000 })
    if (url.pathname === '/v1/community/profile' && method === 'GET') return json(this.profile())
    if (url.pathname === '/v1/community/profile/handle' && method === 'PUT') {
      if (this.failNextHandle) { this.failNextHandle = false; throw new TypeError('network refused') }
      if (body.handle === 'taken.name') return json({ error: { code: 'handle_taken', message: 'That username is already taken.' } }, 409)
      if (body.handle === 'admin') return json({ error: { code: 'handle_reserved', message: 'That username is reserved.' } }, 409)
      this.handle = body.handle
      return json(this.profile())
    }
    throw new Error(`Unhandled fake request: ${method} ${url.pathname}`)
  }
}

function openSignUp () {
  const box = { template: '<div><slot /></div>' }
  const wrapper = shallowMount(SignIn, {
    mocks: { $route: { query: { continue: '/authorize?client_id=fluidd' } } },
    stubs: {
      'v-card': box,
      'v-card-title': box,
      'v-card-subtitle': box,
      'v-card-text': box,
      'v-card-actions': box,
      'v-alert': { template: '<div v-bind="$attrs"><slot /></div>' },
      'v-form': { template: '<form @submit="$emit(`submit`, $event)"><slot /></form>' },
      'v-text-field': { props: ['value'], template: '<label><input :value="value" @input="$emit(`input`, $event.target.value)"></label>' },
      'v-btn': { template: '<button type="button" v-on="$listeners"><slot /></button>' },
      AppBtn: { template: '<button v-on="$listeners"><slot /></button>' }
    }
  })
  vi.spyOn(wrapper.vm as unknown as { go: (url: string) => void }, 'go').mockImplementation(() => {})
  ;(wrapper.vm as unknown as { setMode: (mode: string) => void }).setMode('sign-up')
  return wrapper
}

async function signUp (age: number) {
  const wrapper = openSignUp()
  await wrapper.vm.$nextTick()
  await wrapper.find('[data-tid="sign-up-age"] input').setValue(String(age))
  await wrapper.find('[data-tid="sign-in-email"] input').setValue(`maker${age}@example.test`)
  await wrapper.find('[data-tid="sign-in-password"] input').setValue('correct horse')
  await wrapper.find('form').trigger('submit')
  await settle()
  wrapper.destroy()
}

function becomeSignedIn (token = 'browser-session') {
  localStorage.setItem('muon.cloud.token', token)
  cloudState.account = { id: 'account-1' } as typeof cloudState.account
}

async function openCommunity () {
  const wrapper = mount(AccountCommunity)
  await settle()
  return wrapper
}

async function setHandle (wrapper: Wrapper<Vue>, value: string) {
  await wrapper.find('[data-tid="community-handle"]').setValue(value)
  await wrapper.find('[data-tid="community-claim"]').trigger('click')
  await settle()
}

describe('community identity journeys through components and HTTP services', () => {
  let service: FakeConsole

  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('muon.cloud.url', 'https://control.test')
    cloudState.account = null
    service = new FakeConsole()
    vi.stubGlobal('fetch', vi.fn(service.fetch.bind(service)))
  })

  afterEach(() => {
    modelsAssertion.drop()
    cloudState.account = null
    localStorage.clear()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('creates a 15-year-old password account without promising a public profile', async () => {
    await signUp(15)
    expect(service.accountCreated).toBe(true)
    expect(service.signupBody).toMatchObject({ declared_age: 15, password: 'correct horse' })
    becomeSignedIn()
    const account = await openCommunity()
    expect(account.text()).toContain('public profiles need adult eligibility')
    expect(account.find('option[value="true"]').attributes('disabled')).toBe('disabled')
    expect(account.text()).not.toContain('Public profiles are available')
    expect(account.find('a[href^="https://library.muon3d.com/@"]').exists()).toBe(false)
    account.destroy()
  })

  it('creates an adult account, publishes asynchronously, then reveals the public link after acknowledgement', async () => {
    await signUp(30)
    becomeSignedIn()
    const account = await openCommunity()
    await account.find('select').setValue(true)
    await account.find('button.lib-btn--pri').trigger('click')
    await settle()
    expect(account.text()).toContain('Delivery pending')
    expect(account.find('a[href^="https://library.muon3d.com/@"]').exists()).toBe(false)
    service.acknowledge()
    await account.find('[data-tid="community-refresh"]').trigger('click')
    await settle()
    expect(account.find('a[href="https://library.muon3d.com/@maker.one"]').exists()).toBe(true)
    account.destroy()
  })

  it('honestly warns that the old public identity can linger while switching to Private', async () => {
    service.identity = service.identityFor(30, true)
    service.deliveredPublic = true
    becomeSignedIn()
    const account = await openCommunity()
    await account.find('select').setValue(false)
    await account.find('button.lib-btn--pri').trigger('click')
    await settle()
    expect(account.text()).toContain('previous public identity can remain visible for up to two minutes')
    expect(account.find('a[href="https://library.muon3d.com/@maker.one"]').exists()).toBe(true)
    service.acknowledge()
    await account.find('[data-tid="community-refresh"]').trigger('click')
    await settle()
    expect(account.find('a[href^="https://library.muon3d.com/@"]').exists()).toBe(false)
    account.destroy()
  })

  it('refuses a taken and reserved username before accepting a valid one', async () => {
    service.identity = service.identityFor(30, false)
    becomeSignedIn()
    const account = await openCommunity()
    await setHandle(account, 'taken.name')
    expect(account.text()).toContain('already taken')
    await setHandle(account, 'admin')
    expect(account.text()).toContain('reserved')
    await setHandle(account, 'available.name')
    expect(account.text()).not.toContain('reserved')
    expect(service.handle).toBe('available.name')
    account.destroy()
  })

  it('recovers from the declaration race (409) and never offers age a second time', async () => {
    becomeSignedIn()
    const account = await openCommunity()
    service.identity = service.identityFor(22, false) // another tab wins after the GET
    await account.find('[data-tid="community-age"]').setValue('22')
    await account.find('[data-tid="community-confirm-age"]').trigger('click')
    await settle(); await settle()
    expect(account.find('[data-tid="community-age"]').exists()).toBe(false)
    expect(account.text()).toContain('Age confirmed privately')
    expect(account.text()).not.toContain('already declared')
    account.destroy()
  })

  it('discards edits and announces a sign-out that happens mid-edit', async () => {
    service.identity = service.identityFor(30, false)
    becomeSignedIn()
    const account = await openCommunity()
    await account.find('[data-tid="community-handle"]').setValue('unsaved.name')
    localStorage.removeItem('muon.cloud.token')
    cloudState.account = null
    await account.vm.$nextTick()
    expect(account.find('[data-tid="community-signed-out"]').text()).toContain('signed out')
    expect(account.find('[data-tid="community-handle"]').exists()).toBe(false)
    expect(service.handle).toBe('maker.one')
    account.destroy()
  })

  it('keeps a refused username for retry and makes no success claim', async () => {
    service.identity = service.identityFor(30, false)
    becomeSignedIn()
    const account = await openCommunity()
    service.failNextHandle = true
    await setHandle(account, 'retry.name')
    expect(account.find('[role="alert"]').text()).toContain("can't be reached")
    expect((account.find('[data-tid="community-handle"]').element as HTMLInputElement).value).toBe('retry.name')
    expect(service.handle).toBe('maker.one')
    await account.find('[data-tid="community-claim"]').trigger('click')
    await settle()
    expect(service.handle).toBe('retry.name')
    expect(account.find('[role="alert"]').exists()).toBe(false)
    account.destroy()
  })
})
