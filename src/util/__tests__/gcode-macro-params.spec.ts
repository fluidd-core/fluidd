import gcodeMacroParams, { gcodeMacroParamDefault } from '../gcode-macro-params'

describe('gcodeMacroParams', () => {
  it.each([
    ['{% set ENABLE = params.ENABLE %}', [{ name: 'ENABLE', value: '' }]],
    ['{% set ENABLE = params.ENABLE | default(1) %}', [{ name: 'ENABLE', value: '1' }]],
    ['{% set ENABLE = params._ENABLE %}', [{ name: '_ENABLE', value: '' }]],
    ['{% set ENABLE = params._ENABLE | default(1) %}', [{ name: '_ENABLE', value: '1' }]]
  ])('Expects params of "%s", to be %s', (param, expected) => {
    expect(gcodeMacroParams(param)).toStrictEqual(expected)
  })
})

describe('gcodeMacroParamDefault', () => {
  it.each([
    [' | default(0, true) | float', '0'],
    [' | int | default(0.005, true) | float', '0.005'],
    [' | default("PLA", true)', 'PLA'],
    [' | default("PLA")', 'PLA'],
    ['| int | default(0.2)', '0.2'],
    ['| int | default(-0.2)', '-0.2'],
    ['| int | default( -0.2 )', '-0.2'],
    ['| int | default( - 0.2 )', ''],
    ['|default(printer)|int', ''],
    ['|default(-somevar)|int', ''],
    ['|default(printer.configfile.settings.printer.max_velocity)|int', ''],
    ['|default("this, \\"works,\\"" , true)|trim', 'this, \\"works,\\"'],
    ['|default(",\\"fine,\\"",true)|trim', ',\\"fine,\\"']
  ])('Expects param default of "%s" to be %s', (param, expected) => {
    expect(gcodeMacroParamDefault(param)).toBe(expected)
  })
})
