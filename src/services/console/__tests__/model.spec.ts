import { describe, expect, it } from 'vitest'
import { commandHelp, entryKind, entryText, explain, filterEntries, suggestions } from '../model'

describe('a console line', () => {
  it('reads as text, from the store\'s sanitised HTML', () => {
    expect(entryText('// probe: open<br />// done &amp; dusted')).toBe('// probe: open\n// done & dusted')
  })

  it('is a command, an error, a warning or information', () => {
    expect(entryKind({ type: 'command', message: 'G28' })).toBe('command')
    expect(entryKind({ type: 'response', message: '!! Must home axis first: 10.000 10.000 0.000' })).toBe('error')
    expect(entryKind({ type: 'response', message: '// TMC warning: stepper_x reports otpw' })).toBe('warning')
    expect(entryKind({ type: 'response', message: '// Klipper state: Ready' })).toBe('info')
  })
})

describe('filtering the log', () => {
  const entries = [
    { type: 'command' as const, message: 'G28' },
    { type: 'response' as const, message: '!! Move out of range: 300.000 0.000 0.000 [0.000]' },
    { type: 'response' as const, message: '// Warning: the fan is slow' },
    { type: 'response' as const, message: '// Mesh loaded' }
  ]

  it('keeps commands, warnings (with errors), or errors', () => {
    expect(filterEntries(entries, 'all', '')).toHaveLength(4)
    expect(filterEntries(entries, 'commands', '').map(e => e.message)).toEqual(['G28'])
    expect(filterEntries(entries, 'warnings', '')).toHaveLength(2)
    expect(filterEntries(entries, 'errors', '')).toHaveLength(1)
  })

  it('finds text in any case, after the filter', () => {
    expect(filterEntries(entries, 'all', 'MESH').map(e => e.message)).toEqual(['// Mesh loaded'])
    expect(filterEntries(entries, 'errors', 'mesh')).toHaveLength(0)
  })
})

describe('explaining errors', () => {
  it('says which motor driver faulted', () => {
    expect(explain('!! TMC \'stepper_x\' reports error: GSTAT: 00000001 reset=1(Reset)')).toMatch(/^The X motor driver saw a fault/)
  })

  it('calls the extruder heater the nozzle', () => {
    expect(explain('!! Heater extruder not heating at expected rate')).toMatch(/^The nozzle heated slower/)
    expect(explain('!! Heater heater_bed not heating at expected rate')).toMatch(/^The heater bed heated slower/)
  })

  it('names an unknown command', () => {
    expect(explain('!! Unknown command:"PRINT_STRAT"')).toBe('Klipper doesn\'t know PRINT_STRAT. Check the spelling, or whether a macro by that name is installed.')
  })

  it('leaves other lines alone', () => {
    expect(explain('// Klipper state: Ready')).toBeNull()
  })
})

describe('suggestions while typing', () => {
  const commands = { SET_FAN_SPEED: 'Set the speed of a named fan', SET_PIN: 'Set an output pin', G28: 'Home', SET_LED: 'Set an LED' }

  it('offers commands sent before, newest first, with how often', () => {
    const history = ['SET_FAN_SPEED FAN=part_fan SPEED=0.5', 'G28', 'SET_FAN_SPEED FAN=part_fan SPEED=0.5', 'SET_FAN_SPEED FAN=aux SPEED=1']
    expect(suggestions('set_fan', commands, history).slice(0, 2)).toEqual([
      { text: 'SET_FAN_SPEED FAN=part_fan SPEED=0.5', hint: 'used 2 times', from: 'history' },
      { text: 'SET_FAN_SPEED FAN=aux SPEED=1', hint: 'used before', from: 'history' }
    ])
  })

  it('then Klipper\'s commands while the first word is typed, shortest first, with their help', () => {
    expect(suggestions('SET_', commands, [])).toEqual([
      { text: 'SET_LED', hint: 'Set an LED', from: 'command' },
      { text: 'SET_PIN', hint: 'Set an output pin', from: 'command' },
      { text: 'SET_FAN_SPEED', hint: 'Set the speed of a named fan', from: 'command' }
    ])
  })

  it('offers no commands once parameters are being typed, nor the line itself', () => {
    expect(suggestions('SET_PIN PIN=', commands, [])).toEqual([])
    expect(suggestions('G28', commands, ['G28'])).toEqual([])
    expect(suggestions('  ', commands, ['G28'])).toEqual([])
  })

  it('offers a command once, from the history, when it was sent on its own', () => {
    expect(suggestions('SET_P', commands, ['SET_PIN'])).toEqual([{ text: 'SET_PIN', hint: 'used before', from: 'history' }])
  })

  it('gives the help of the command typed', () => {
    expect(commandHelp('set_pin PIN=beeper', commands)).toBe('Set an output pin')
    expect(commandHelp('NOPE', commands)).toBeNull()
  })
})
