import { gcodeMacroParamDefault } from '../gcode-macro-params'

describe('gcodeMacroParamDefault', () => {
  it.each([
    [' | default(0, true) | float', '0'],
    [' | int | default(0.005, true) | float', '0.005'],
    [' | default("PLA", true)', '"PLA"'],
    [' | default("PLA")', '"PLA"'],
    ['| int | default(0.2)', '0.2'],
    ['| int | default(-0.2)', '-0.2'],
    ['| int | default( -0.2 )', '-0.2'],
    ['| int | default( - 0.2 )', ''],
    ['|default(printer)|int', ''],
    ['|default(-somevar)|int', ''],
    ['|default(printer.configfile.settings.printer.max_velocity)|int', ''],
    ['|default("this, \\"works,\\"" , true)|trim', '"this, \\"works,\\""'],
    ['|default(",\\"fine,\\"",true)|trim', '",\\"fine,\\""'],
    ['|default(\',2\',true)|trim', '\',2\'']
  ])('Expects param default of "%s" to be %s', (param, expected) => {
    expect(gcodeMacroParamDefault(param)).toBe(expected)
  })
})
