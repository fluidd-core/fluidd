import Vue from 'vue'
import Vuetify from 'vuetify'
import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import MaterialPicker from '@/components/overview/MaterialPicker.vue'

Vue.use(Vuetify)

it('keeps the real menu and catalog open while searching and pinning', async () => {
  const general = Vue.observable({ pinnedMaterials: null as string[] | null })
  const printer = { save_variables: { variables: { muon_material: 'PLA' } } }
  const send = vi.fn()
  const app = document.createElement('div')
  app.setAttribute('data-app', 'true')
  const host = document.createElement('div')
  app.appendChild(host)
  document.body.appendChild(app)
  const wrapper = mount(MaterialPicker, {
    vuetify: new Vuetify(),
    attachTo: host,
    propsData: { chip: true },
    mocks: {
      $store: {
        state: { printer: { printer }, config: { uiSettings: { general } } },
        getters: { 'spoolman/getActiveSpool': null },
        dispatch: vi.fn((_action, payload) => { general.pinnedMaterials = payload.value })
      }
    },
    computed: {
      klippyReady: () => true,
      materialChoices: () => ['PLA', 'Bamboo blend'].map(name => ({
        name, nozzle: 215, bed: 60, colour: '#E8A53B', presetId: null
      })),
      printerPrinting: () => false,
      printerPaused: () => false
    },
    methods: { sendGcode: send },
    stubs: {
      'frame-icon': true,
      'router-link': { template: '<a><slot /></a>' }
    }
  })
  try {
    await wrapper.find('button').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 50))
    const browse = document.querySelector<HTMLButtonElement>('[data-tid="material-see-all"]')
    expect(browse).not.toBeNull()
    browse!.click()
    await new Promise(resolve => setTimeout(resolve, 50))
    const search = document.querySelector<HTMLInputElement>('[aria-label="Search materials"]')!
    expect(search).not.toBeNull()
    search.focus()
    search.value = 'Bamboo'
    search.dispatchEvent(new Event('input', { bubbles: true }))
    await Vue.nextTick()
    expect(document.activeElement).toBe(search)
    document.querySelector<HTMLButtonElement>('[aria-label="Pin Bamboo blend"]')!.click()
    await Vue.nextTick()
    expect(general.pinnedMaterials).toContain('Bamboo blend')
    expect((wrapper.vm as unknown as { open: boolean }).open).toBe(true)
    expect((wrapper.vm as unknown as { showAll: boolean }).showAll).toBe(true)
    expect(send).not.toHaveBeenCalled()
    document.querySelector<HTMLButtonElement>('[data-tid="material-catalog-done"]')!.click()
    await Vue.nextTick()
    expect((wrapper.vm as unknown as { showAll: boolean }).showAll).toBe(false)
  } finally {
    wrapper.destroy()
    app.remove()
  }
})
