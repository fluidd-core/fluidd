import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, expect, it } from 'vitest'
import ControlTaskFold from '../ControlTaskFold.vue'
import PersonalTaskFold from '../PersonalTaskFold.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { panelStore } from './panel-fixture'

afterEach(() => { cloudState.activePrinterId = null; printerTransportBinding.remote = false })

it('opens an unidentified local fold without inventing a saved printer identity', async () => {
  const wrapper = mount(ControlTaskFold, { propsData: { foldKey: 'heat.other', title: 'Other temperatures', summary: 'CPU 52°' }, mocks: { $store: panelStore() }, slots: { default: '<p>CPU 52°</p>' } })
  await wrapper.find('button').trigger('click')
  expect(wrapper.find('button').attributes('aria-expanded')).toBe('true')
  expect(wrapper.text()).toContain('this visit')
  expect(wrapper.findComponent(PersonalTaskFold).exists()).toBe(false)
  wrapper.destroy()
})

it('passes the stable selected console ID to personal folds and clears local state on connection changes', async () => {
  const store = panelStore()
  const wrapper = mount(ControlTaskFold, { propsData: { foldKey: 'heat.other', title: 'Other temperatures', summary: 'CPU 52°' }, mocks: { $store: store }, stubs: { PersonalTaskFold: true } })
  await wrapper.find('button').trigger('click')
  store.state.config.apiUrl = 'http://other.local'; await Vue.nextTick()
  expect(wrapper.find('button').attributes('aria-expanded')).toBe('false')
  store.state.config.apiUrl = 'https://muon-cloud.invalid'
  printerTransportBinding.remote = true; cloudState.activePrinterId = 'printer-123'; await Vue.nextTick()
  expect(wrapper.findComponent(PersonalTaskFold).props('printerId')).toBe('printer-123')
  wrapper.destroy()
})
