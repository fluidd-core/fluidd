import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NumberField from '../NumberField.vue'

const show = () => mount(NumberField, { propsData: { value: 20, min: 0, max: 100, unit: 'mm', label: 'Go to X' }, attachTo: document.body })

describe('typed values', () => {
  it.each(['', ' ', 'wrong', 'Infinity', '-Infinity', 'NaN', '101', '-1', '0x20'])('refuses %j without sending and explains invalid drafts', async draft => {
    const w = show()
    await w.find('input').trigger('focus')
    await w.find('input').setValue(draft)
    await w.find('input').trigger('keydown.enter')
    expect(w.emitted('change')).toBeUndefined()
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
    expect(w.text()).toContain('Enter a number')
    w.destroy()
  })

  it('commits a decimal once across Enter and blur, with its unit and name', async () => {
    const w = show()
    expect(w.text()).toContain('mm')
    expect(w.find('input').attributes('aria-label')).toBe('Go to X')
    await w.find('input').setValue('25,5')
    await w.find('input').trigger('keydown.enter')
    await w.find('input').trigger('blur')
    expect(w.emitted('change')).toEqual([[25.5]])
    w.destroy()
  })

  it('keeps untouched reports live and edited drafts stable; Escape restores the latest report without sending', async () => {
    const w = show()
    const input = w.find('input')
    await input.trigger('focus')
    await w.setProps({ value: 22 })
    expect((input.element as HTMLInputElement).value).toBe('22')
    await input.setValue('27')
    await w.setProps({ value: 23 })
    expect((input.element as HTMLInputElement).value).toBe('27')
    await input.trigger('keydown.esc')
    await input.trigger('blur')
    expect((input.element as HTMLInputElement).value).toBe('23')
    expect(w.emitted('change')).toBeUndefined()
    w.destroy()
  })

  it('rechecks changed limits and disabled state at commit', async () => {
    const w = show()
    await w.find('input').setValue('80')
    await w.setProps({ max: 50 })
    await w.find('input').trigger('blur')
    expect(w.emitted('change')).toBeUndefined()
    await w.find('input').setValue('30')
    await w.setProps({ disabled: true })
    await w.find('input').trigger('blur')
    expect(w.emitted('change')).toBeUndefined()
    w.destroy()
  })

  it('allows limits, signed decimal/exponent input and never displays non-finite live values', async () => {
    const w = show()
    await w.find('input').setValue('1e2')
    await w.find('input').trigger('blur')
    expect(w.emitted('change')).toEqual([[100]])
    await w.setProps({ value: Infinity })
    expect((w.find('input').element as HTMLInputElement).value).toBe('')
    w.destroy()
  })
})
