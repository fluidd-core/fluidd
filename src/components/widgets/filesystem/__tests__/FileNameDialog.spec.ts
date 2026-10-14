import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FileNameDialog from '../FileNameDialog.vue'

/** Vuetify's dialog as a plain element. */
const stubs = {
  'v-dialog': { props: ['value'], template: '<div v-if="value" class="dialog"><slot /></div>' }
}

function ask (name: string) {
  return mount(FileNameDialog, {
    propsData: { value: true, title: 'Rename the file', label: 'Name', name },
    stubs,
    attachTo: document.body,
    mocks: { $t: (key: string) => ({ 'app.general.btn.save': 'Save', 'app.general.btn.cancel': 'Cancel' }[key] ?? key) }
  })
}

const tid = (wrapper: ReturnType<typeof ask>, id: string) => wrapper.find(`[data-tid="${id}"]`)

describe('FileNameDialog', () => {
  it('starts with the name in the box, the part before its extension selected', async () => {
    const wrapper = ask('benchy.gcode')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    const input = tid(wrapper, 'file-name-input').element as HTMLInputElement
    expect(input.value).toBe('benchy.gcode')
    expect(document.activeElement).toBe(input)
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 6])
    wrapper.destroy()
  })

  it('saves the new name and closes', async () => {
    const wrapper = ask('benchy.gcode')
    await tid(wrapper, 'file-name-input').setValue('boat.gcode')
    await tid(wrapper, 'file-name-save').trigger('click')
    expect(wrapper.emitted('save')).toEqual([['boat.gcode']])
    expect(wrapper.emitted('input')).toEqual([[false]])
    wrapper.destroy()
  })

  it('keeps Save off with no name, and Enter does nothing then', async () => {
    const wrapper = ask('')
    expect(tid(wrapper, 'file-name-save').attributes('disabled')).toBe('disabled')
    await tid(wrapper, 'file-name-input').setValue('   ')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('save')).toBeUndefined()
    wrapper.destroy()
  })
})
