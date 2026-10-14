import { afterEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'

// The dialog itself is M3Confirm.spec.ts; here, only how $confirm mounts it and answers.
vi.mock('@/components/ui/M3Confirm.vue', async () => {
  const { default: V } = await import('vue')
  return {
    default: V.extend({
      name: 'M3Confirm',
      props: ['message', 'title', 'buttonTrueText', 'danger', 'plateCheck', 'color', 'icon'],
      render (h) {
        return h('div', { class: 'fake-confirm', attrs: { 'data-props': JSON.stringify(this.$props) } }, this.message)
      }
    })
  }
})

const { ConfirmPlugin } = await import('../confirm')

const answer = (value: boolean) => {
  const el = document.querySelector('.fake-confirm') as HTMLElement & { __vue__: Vue }
  el.__vue__.$emit('result', value)
}

describe('$confirm', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('mounts the redesign\'s confirm with the message and the options, and resolves with its answer', async () => {
    const Local = Vue.extend()
    Local.use(ConfirmPlugin, { vuetify: {} as never })
    const vm = new Local()
    const asked = vm.$confirm('It goes from Walnut.', { title: 'Delete Benchy?', buttonTrueText: 'Delete', danger: true, color: 'card-heading', icon: '$error' })
    const el = document.querySelector('.fake-confirm') as HTMLElement
    expect(el.textContent).toBe('It goes from Walnut.')
    const props = JSON.parse(el.dataset.props ?? '{}')
    expect(props).toMatchObject({ message: 'It goes from Walnut.', title: 'Delete Benchy?', buttonTrueText: 'Delete', danger: true })
    // vuetify-confirm's colour and icon mean nothing to it.
    expect(props.color).toBeUndefined()
    expect(props.icon).toBeUndefined()
    answer(true)
    await expect(asked).resolves.toBe(true)
    expect(document.querySelector('.fake-confirm')).toBeNull()
  })

  it('resolves false for no, and asks each question in its own dialog', async () => {
    const Local = Vue.extend()
    Local.use(ConfirmPlugin, { vuetify: {} as never })
    const vm = new Local()
    const first = vm.$confirm('One')
    answer(false)
    await expect(first).resolves.toBe(false)
    const second = vm.$confirm('Two', { plateCheck: true })
    const props = JSON.parse((document.querySelector('.fake-confirm') as HTMLElement).dataset.props ?? '{}')
    expect(props.plateCheck).toBe(true)
    answer(true)
    await expect(second).resolves.toBe(true)
  })
})
