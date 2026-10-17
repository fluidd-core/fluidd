import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CloudAccountDialog from '../CloudAccountDialog.vue'

const signUp = vi.hoisted(() => vi.fn())
vi.mock('@/services/muon-cloud/state', () => ({ signIn: vi.fn(), signUp }))
vi.mock('@/services/muon-cloud/centralLogin', () => ({ centralLoginEnabled: () => false, startCentralSignIn: vi.fn() }))

const box = { template: '<div><slot /></div>' }
function open () {
  return shallowMount(CloudAccountDialog, {
    propsData: { value: true, initialMode: 'sign-up' },
    stubs: {
      'v-dialog': box,
      'v-card': box,
      'v-card-title': box,
      'v-card-subtitle': box,
      'v-card-text': box,
      'v-card-actions': box,
      'v-form': { template: '<form @submit="$emit(`submit`, $event)"><slot /></form>' },
      'v-text-field': { props: ['value'], template: '<label><input :value="value" @input="$emit(`input`, $event.target.value)"></label>' },
      'v-alert': { template: '<div v-bind="$attrs"><slot /></div>' },
      'v-btn': box,
      AppBtn: { template: '<button v-on="$listeners"><slot /></button>' }
    }
  })
}
const settle = () => new Promise(resolve => setTimeout(resolve))

describe('account dialog signup', () => {
  afterEach(() => { vi.clearAllMocks() })
  it.each(['12', '121', 'nope', '13.5'])('rejects invalid private age %s before the request', async value => {
    const w = open(); const age = w.find('[data-tid="sign-up-age"]')
    await age.find('input').setValue(value); await w.find('form').trigger('submit'); await settle()
    expect(signUp).not.toHaveBeenCalled()
    expect(age.attributes('aria-describedby')).toContain('dialog-sign-up-age-error')
    expect(w.find('[data-tid="sign-up-age-error"][role="alert"]').exists()).toBe(true)
  })
})
