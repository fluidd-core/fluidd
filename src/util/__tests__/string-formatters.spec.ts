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
