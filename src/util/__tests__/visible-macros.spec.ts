import { describe, expect, it } from 'vitest'
import type { Macro } from '@/store/macros/types'
import { visibleMacros } from '../visible-macros'

const macro = (name: string): Macro => ({ name, visible: true })

describe('the visible macros', () => {
  it('are every category\'s macros, in order', () => {
    const groups = [
      { id: 'a', name: 'Filament', macros: [macro('load_filament'), macro('unload_filament')] },
      { id: '0', name: null, macros: [macro('park')] }
    ]
    expect(visibleMacros(groups).map(m => m.name)).toEqual(['load_filament', 'unload_filament', 'park'])
  })

  it('are none when the store has none', () => {
    expect(visibleMacros(undefined)).toEqual([])
  })
})
