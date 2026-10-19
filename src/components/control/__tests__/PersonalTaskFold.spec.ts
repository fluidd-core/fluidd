import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ControlPreferenceStore } from '@/services/control/preferences'

vi.mock('@/services/muon-cloud/state', () => ({ cloudState: Vue.observable({ account: null }) }))
const { cloudState } = await import('@/services/muon-cloud/state')
const { default: PersonalTaskFold } = await import('../PersonalTaskFold.vue')
const settle = async () => { for (let i = 0; i < 12; i++) { await Promise.resolve(); await Vue.nextTick() } }

describe('remembered task folds', () => {
  afterEach(() => { cloudState.account = null; localStorage.clear() })
  it('remounts independent choices and clears them immediately when the person changes', async () => {
    const store = new ControlPreferenceStore({ read: async () => ({ version: 1, folds: {} }), patch: async (_, folds) => ({ version: 1, folds }) }, localStorage)
    const show = () => mount(PersonalTaskFold, { propsData: { printerId: 'stable-1', foldKey: 'heat.other', foldId: 'other-temperatures', title: 'Other temperatures', summary: '5 sensors', preferences: store } })
    const first = show()
    await settle()
    await first.find('button').trigger('click')
    await settle()
    expect(first.find('button').attributes('aria-expanded')).toBe('true')
    first.destroy()
    const second = show()
    await settle()
    expect(second.find('button').attributes('aria-expanded')).toBe('true')
    localStorage.setItem('muon.cloud.token', 'alice-session')
    cloudState.account = { id: 'alice', email: 'alice@example.test', name: 'Alice', created_at: 1 }
    await settle()
    expect(second.find('button').attributes('aria-expanded')).toBe('false')
    await second.setProps({ printerId: 'stable-2' })
    await settle()
    expect(second.find('button').attributes('aria-expanded')).toBe('false')
    second.destroy()
  })

  it('shows an unavailable sync result beside the fold with a retry action', async () => {
    cloudState.account = { id: 'alice', email: 'alice@example.test', name: 'Alice', created_at: 1 }
    localStorage.setItem('muon.cloud.token', 'alice-session')
    const store = new ControlPreferenceStore({ read: async () => { throw new Error('Offline') }, patch: async () => { throw new Error('Offline') } }, localStorage)
    const w = mount(PersonalTaskFold, { propsData: { printerId: 'stable-1', foldKey: 'fans.all', foldId: 'all-fans', title: 'All fans', summary: '3 running', preferences: store } })
    await settle()
    expect(w.find('[role="status"]').text()).toContain('not saved')
    expect(w.findAll('button').at(1).text()).toBe('Try again')
    w.destroy()
  })
})
