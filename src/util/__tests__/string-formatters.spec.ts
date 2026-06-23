import stringFormatters from '../string-formatters'

describe('prettyCase', () => {
  const sf = stringFormatters()

  it.each([
    ['_  hello   _ _world_ ', 'Hello World'],
    ['raspberry pi 3b+', 'Raspberry Pi 3b+'],
    ['Raspberry Pi 3B+', 'Raspberry Pi 3B+'],
    ['active (running)', 'Active (Running)'],
  ])('Expects pretty case of "%s" to be "%s"', (input, expected) => {
    expect(sf.prettyCase(input)).toBe(expected)
  })
})

describe('getReadableLengthString', () => {
  const sf = stringFormatters()

  it.each([
    [12.34, undefined, '12.3 mm'],
    [123.4, undefined, '12.3 cm'],
    [1234, undefined, '1.23 m'],
    [1234567, { showKilometers: true }, '1.23 km'],
    [1234567, undefined, '1234.57 m'],
    [0.05, { showMicrons: true }, '50 μm'],
    [0.05, undefined, '0.1 mm'],
  ])('formats %d (options: %o) as "%s"', (length, options, expected) => {
    expect(sf.getReadableLengthString(length, options)).toBe(expected)
  })

  it('honors fractionDigits from options', () => {
    expect(sf.getReadableLengthString(12.3456, { fractionDigits: 3 })).toBe('12.346 mm')
    expect(sf.getReadableLengthString(1234, { fractionDigits: 0 })).toBe('1 m')
  })
})
