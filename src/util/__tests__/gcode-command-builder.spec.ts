import { gcodeCommandBuilder } from '../gcode-helpers'

describe('gcodeCommandBuilder', () => {
  it.each([
    [{ command: 'M117', params: { Message: '' } }, 'M117'],
    [{ command: 'M117', params: { Message: 'ab' } }, 'M117 ab'],
    [{ command: 'M117', params: { Message: { value: 'ab' } } }, 'M117 ab'],
    [{ command: 'G1', params: { } }, 'G1'],
    [{ command: 'G1', params: { X: '' } }, 'G1'],
    [{ command: 'G1', params: { X: 10 } }, 'G1 X10'],
    [{ command: 'G1', params: { X: { value: 10 } } }, 'G1 X10'],
    [{ command: 'TEST', params: { } }, 'TEST'],
    [{ command: 'TEST', params: { X: '' } }, 'TEST'],
    [{ command: 'TEST', params: { X: 'abc' } }, 'TEST X=abc'],
    [{ command: 'TEST', params: { X: 'a b c' } }, 'TEST X="a b c"'],
    [{ command: 'TEST', params: { X: ' a b c ' } }, 'TEST X=" a b c "'],
    [{ command: 'TEST', params: { X: 'a\'b\'c' } }, 'TEST X="a\'b\'c"'],
    [{ command: 'TEST', params: { X: 'a"b"c' } }, 'TEST X="a\\"b\\"c"'],
    [{ command: 'TEST', params: { X: 'a#b#c' } }, 'TEST X="a#b#c"'],
    [{ command: 'TEST', params: { X: 'a;b;c' } }, 'TEST X="a;b;c"'],
    [{ command: 'TEST', params: { X: 'a=b=c' } }, 'TEST X="a=b=c"'],
    [{ command: 'TEST', params: { X: 'a\\b\\c' } }, 'TEST X="a\\\\b\\\\c"'],
  ])('Expects params of "%s", to be %s', ({ command, params }, expected) => {
    expect(gcodeCommandBuilder(command, params)).toStrictEqual(expected)
  })
})
