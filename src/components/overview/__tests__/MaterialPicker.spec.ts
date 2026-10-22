import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import MaterialPicker from '@/components/overview/MaterialPicker.vue'

const choices = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PA', 'PC', 'Bamboo blend'].map(name => ({
  name, nozzle: 215, bed: 60, colour: '#E8A53B', presetId: null
}))

function setup (pins: string[] | null = null, busy = false) {
  const general = Vue.observable({ pinnedMaterials: pins })
  const printer = Vue.observable({ save_variables: { variables: { muon_material: 'PLA' } }, printing: busy, paused: false })
  const send = vi.fn()
  const dispatch = vi.fn((_action, payload) => { general.pinnedMaterials = payload.value })
  const wrapper = shallowMount(MaterialPicker, {
    propsData: { chip: true },
    mocks: {
      $store: {
        state: { printer: { printer }, config: { uiSettings: { general } } },
        getters: { 'spoolman/getActiveSpool': null },
        dispatch
      }
    },
    computed: {
      klippyReady: () => true,
      materialChoices: () => choices,
      printerPrinting: () => printer.printing,
      printerPaused: () => printer.paused
    },
    methods: { sendGcode: send },
    stubs: {
      'frame-icon': true,
      'v-menu': { template: '<div><slot name="activator" :on="{}" :attrs="{}" /><slot /></div>' },
      'v-dialog': { template: '<div><slot /></div>' }
    }
  })
  return {
    wrapper,
    general,
    send,
    dispatch,
    cleanup: () => {
      wrapper.destroy()
    }
  }
}

describe('material picker favorites', () => {
  it('starts with five common materials and keeps the full catalog searchable', async () => {
    const { wrapper } = setup()
    expect(wrapper.find('[data-tid="material-shortlist"]').findAll('[role="option"]').wrappers.map(row => row.find('b').text()))
      .toEqual(['PLA', 'PETG', 'ABS', 'ASA', 'TPU'])

    await wrapper.find('[data-tid="material-see-all"]').trigger('click')
    const search = wrapper.find('[aria-label="Search materials"]')
    await search.setValue('  bAmBoO  ')
    expect(wrapper.find('[data-tid="material-catalog"]').findAll('[data-tid^="catalog-material-"]').wrappers.map(row => row.find('b').text()))
      .toEqual(['Bamboo blend'])
    await wrapper.find('[data-tid="catalog-material-Bamboo blend"]').trigger('click')
    expect((wrapper.vm as unknown as { showAll: boolean }).showAll).toBe(false)
    await wrapper.find('[data-tid="material-see-all"]').trigger('click')
    expect((wrapper.find('[aria-label="Search materials"]').element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('[data-tid="material-catalog"]').findAll('[data-tid^="catalog-material-"]').length).toBe(8)
  })

  it('persists pinning across shared picker instances without sending printer commands', async () => {
    const { wrapper, general, dispatch, send } = setup()
    await wrapper.find('[data-tid="material-see-all"]').trigger('click')
    await wrapper.find('[aria-label="Pin PA"]').trigger('click')
    expect(dispatch).toHaveBeenLastCalledWith('config/saveByPath', {
      path: 'uiSettings.general.pinnedMaterials', value: ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PA'], server: true
    })
    expect(wrapper.find('[data-tid="material-shortlist"]').find('[data-tid="material-PA"]').exists()).toBe(true)
    const other = setup(general.pinnedMaterials)
    expect(other.wrapper.find('[data-tid="material-shortlist"]').find('[data-tid="material-PA"]').exists()).toBe(true)
    expect(send).not.toHaveBeenCalled()
  })

  it('honors an empty pinned list and explains empty search results', async () => {
    const { wrapper } = setup([])
    expect(wrapper.find('[data-tid="material-shortlist"]').findAll('[role="option"]').length).toBe(0)
    expect(wrapper.text()).toContain('Pin materials from See all')
    await wrapper.find('[data-tid="material-see-all"]').trigger('click')
    await wrapper.find('[aria-label="Search materials"]').setValue('unobtainium')
    expect(wrapper.find('[data-tid="material-catalog"]').text()).toContain('No materials found')
  })

  it('can unpin the last material and reacts to preferences changed by another picker', async () => {
    const { wrapper, general, dispatch, send } = setup(['pa'])
    expect(wrapper.find('[data-tid="material-shortlist"]').find('[data-tid="material-PA"]').exists()).toBe(true)
    await wrapper.find('[data-tid="material-see-all"]').trigger('click')
    await wrapper.find('[aria-label="Unpin PA"]').trigger('click')
    expect(dispatch).toHaveBeenLastCalledWith('config/saveByPath', {
      path: 'uiSettings.general.pinnedMaterials', value: [], server: true
    })
    expect(wrapper.find('[data-tid="material-shortlist"]').findAll('[role="option"]').length).toBe(0)
    general.pinnedMaterials = ['Bamboo blend']
    await Vue.nextTick()
    expect(wrapper.find('[data-tid="material-shortlist"]').find('[data-tid="material-Bamboo blend"]').exists()).toBe(true)
    expect(send).not.toHaveBeenCalled()
  })

  it('lets users organize pins while busy but keeps material selection disabled', async () => {
    const { wrapper, dispatch, send } = setup(null, true)
    await wrapper.find('[data-tid="material-see-all"]').trigger('click')
    expect(wrapper.find('[data-tid="catalog-material-PA"]').attributes('disabled')).toBeDefined()
    await wrapper.find('[aria-label="Pin PA"]').trigger('click')
    expect(dispatch).toHaveBeenCalledOnce()
    expect(send).not.toHaveBeenCalled()
  })
})
