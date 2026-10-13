import toCsv from '../csv'

describe('toCsv', () => {
  it.each([
    ['plain', 'plain'],
    ['a,b', '"a,b"'],
    ['say "hi"', '"say ""hi"""'],
    ['line\nbreak', '"line\nbreak"'],
    ['cube #1.gcode', 'cube #1.gcode'],
    [12.5, '12.5'],
    [-3, '-3'],
    [true, 'true'],
    [new Date(2026, 9, 12, 8, 5, 9), '2026-10-12 08:05:09'],
    [new Date(2026, 0, 2, 0, 0, 0), '2026-01-02 00:00:00'],
    [new Date(NaN), ''],
    [['PLA', 'PETG'], 'PLA; PETG'],
    [[1.5, 2.5], '1.5; 2.5'],
    [[-1, 2], '-1; 2'],
    [['a,b', null, new Date(2026, 9, 12, 8, 5, 9)], '"a,b; ; 2026-10-12 08:05:09"'],
    [[], ''],
    [null, ''],
    [undefined, ''],
    ['', ''],
  ])('writes %o as %o', (value, expected) => {
    expect(toCsv([[value]])).toBe(expected)
  })

  it.each([
    ['=1+1', "'=1+1"],
    ['+1', "'+1"],
    ['-part.gcode', "'-part.gcode"],
    ['@SUM(A1)', "'@SUM(A1)"],
    ['=A1,B1', '"\'=A1,B1"'],
    [['=1+1', 'b'], "'=1+1; b"],
  ])('writes the formula-like string %o as text', (value, expected) => {
    expect(toCsv([[value]])).toBe(expected)
  })

  it('separates cells with commas and rows with CRLF', () => {
    expect(toCsv([
      ['Name', 'Duration (s)'],
      ['a.gcode', 60],
      ['b.gcode', 120],
    ])).toBe('Name,Duration (s)\r\na.gcode,60\r\nb.gcode,120')
  })

  it('returns an empty string for no rows', () => {
    expect(toCsv([])).toBe('')
  })
})
