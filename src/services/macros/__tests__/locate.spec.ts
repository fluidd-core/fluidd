import { describe, expect, it } from 'vitest'
import { configFilesToRead, macroPlaces, macroSections } from '../locate'

describe('finding where a macro is written', () => {
  it('reads each [gcode_macro NAME] with its line, whatever the spacing and case', () => {
    const file = '[gcode_macro LOAD_FILAMENT]\ngcode:\n  M83\n\n  [ gcode_macro  unload_filament ]\ndescription: x\n[gcode_macro M600]\r\ngcode: PAUSE'
    expect([...macroSections(file)]).toEqual([['LOAD_FILAMENT', 1], ['UNLOAD_FILAMENT', 5], ['M600', 7]])
  })

  it('ignores a commented-out macro', () => {
    expect(macroSections('#[gcode_macro OLD]\n[gcode_macro NEW]').has('OLD')).toBe(false)
  })

  it('reads config files, not backups or other files', () => {
    expect(configFilesToRead([
      { path: 'macros/filament.cfg', size: 16000 },
      { path: 'core.cfg', size: 33000 },
      { path: 'backups/20260918T160855Z-3f640546/core.cfg', size: 11000 },
      { path: 'notes.txt', size: 10 }
    ])).toEqual(['core.cfg', 'macros/filament.cfg'])
  })

  it('places each macro in the first file that defines it', () => {
    const places = macroPlaces('config', [
      { path: 'core.cfg', content: '[gcode_macro CENTER]\n' },
      { path: 'macros/position.cfg', content: '\n\n[gcode_macro CENTER]\n[gcode_macro Z_PARK]' }
    ])
    expect(places.get('CENTER')).toEqual({ root: 'config', path: 'core.cfg', line: 1 })
    expect(places.get('Z_PARK')).toEqual({ root: 'config', path: 'macros/position.cfg', line: 4 })
  })
})
