import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PromptDialog } from '@/store/console/types'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))

const { default: ActionCommandPromptDialog } = await import('../ActionCommandPromptDialog.vue')

/** Vuetify's dialog as a plain element. */
const stubs = {
  'v-dialog': { props: ['value'], template: '<div v-if="value" class="dialog"><slot /></div>' }
}

function show (dialog: Partial<PromptDialog>, displayName = 'Boxwood · 367A') {
  const promptDialog: PromptDialog = { open: true, title: 'Filament Load Failed', items: [], footerButtons: [], ...dialog }
  return mount(ActionCommandPromptDialog, {
    stubs,
    attachTo: document.body,
    mocks: {
      $store: {
        state: { console: { promptDialog } },
        getters: { 'config/getDisplayName': displayName },
        dispatch: vi.fn()
      }
    }
  })
}

const tid = (wrapper: ReturnType<typeof show>, id: string) => wrapper.find(`[data-tid="${id}"]`)

describe('ActionCommandPromptDialog', () => {
  afterEach(() => { socket.printerGcodeScript.mockClear() })

  it("shows the macro's title and words, from the printer it came from", () => {
    const wrapper = show({ items: [{ type: 'text', text: 'Filament was not grabbed. Try loading again or cancel.' }] })
    expect(wrapper.find('.m3-dlg__eyebrow').text()).toBe('From Boxwood')
    expect(wrapper.find('.m3-dlg__title').text()).toBe('Filament Load Failed')
    expect(wrapper.find('.printer-prompt__text').text()).toBe('Filament was not grabbed. Try loading again or cancel.')
    wrapper.destroy()
  })

  it('sends a button its command, and colours it as the macro asks', async () => {
    const wrapper = show({
      footerButtons: [
        { text: 'Try Load Again', command: 'FILAMENT_INSERT_SENSORLESS_LOAD', color: 'primary' },
        { text: 'Cancel', command: 'FILAMENT_INSERT_CANCEL', color: 'error' }
      ],
      items: [{ type: 'button', text: 'Full Purge', command: 'FILAMENT_INSERT_FULL_PURGE_GATE', color: 'warning' }]
    })
    expect(tid(wrapper, 'printer-prompt-button-0').classes()).toContain('cbtn--primary')
    expect(tid(wrapper, 'printer-prompt-button-1').classes()).toContain('cbtn--danger')
    expect(tid(wrapper, 'printer-prompt-item-0').classes()).toContain('cbtn--warn')
    await tid(wrapper, 'printer-prompt-button-1').trigger('click')
    await tid(wrapper, 'printer-prompt-item-0').trigger('click')
    expect(socket.printerGcodeScript.mock.calls.map(c => c[0])).toEqual(['FILAMENT_INSERT_CANCEL', 'FILAMENT_INSERT_FULL_PURGE_GATE'])
    wrapper.destroy()
  })

  it('a button with no command sends its text, as Klipper expects', async () => {
    const wrapper = show({ footerButtons: [{ text: 'RESUME' }] })
    await tid(wrapper, 'printer-prompt-button-0').trigger('click')
    expect(socket.printerGcodeScript.mock.calls[0][0]).toBe('RESUME')
    wrapper.destroy()
  })

  it('ends the prompt when it is closed (✕, Esc, a click outside)', async () => {
    const wrapper = show({})
    await tid(wrapper, 'm3-dlg-close').trigger('click')
    expect(socket.printerGcodeScript.mock.calls[0][0]).toBe('RESPOND TYPE=command MSG="action:prompt_end"')
    wrapper.destroy()
  })

  it('has no buttons row when the macro gives none', () => {
    const wrapper = show({ footerButtons: [] })
    expect(wrapper.find('.m3-dlg__actions').exists()).toBe(false)
    wrapper.destroy()
  })
})
