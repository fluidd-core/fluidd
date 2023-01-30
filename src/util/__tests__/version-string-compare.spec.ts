import versionStringCompare from '../version-string-compare'

describe('naturalStringCompare', () => {
  it.each([
    [{ a: '1', b: '' }, 1],
    [{ a: '1', b: '1' }, 0],
    [{ a: '1', b: 'a' }, -1],
    [{ a: 'a', b: 'a' }, 0],
    [{ a: 'a1', b: 'a' }, 1],
    [{ a: 'a1', b: 'a1' }, 0],
    [{ a: 'a1', b: 'a2' }, -1],
    [{ a: 'a10', b: 'a2' }, 1],
    [{ a: 'a10a', b: 'a2' }, 1],
    [{ a: 'a10', b: 'a2a' }, 1],
    [{ a: 'a10a1', b: 'a10a10' }, -1],
    [{ a: 'a1a', b: 'a2' }, -1]
  ])('Expects natural comparison of "%s" to be %d', ({ a, b }, expected) => {
    switch (expected) {
      case -1:
        expect(versionStringCompare(a, b)).toBeLessThan(0)
        break
      case 1:
        expect(versionStringCompare(a, b)).toBeGreaterThan(0)
        break
      default:
        expect(versionStringCompare(a, b)).toBe(0)
        break
    }
  })

  it('Can version sort files correctly', () => {
    const input = [
      'Untitled',
      'Untitled.1gcode',
      'Untitled.22.gcode',
      'Untitled.2gcode',
      'Untitled.gcode',
      'Untitled2',
      'Untitled22',
      'Untitled22.gcode',
      'Untitled22.1gcode',
      'Untitled2a',
      'Untitled3',
      'Untitled_.gcode',
      'Untitled_22',
      'Untitled_22.gcode',
      'Untitleda22',
      'Untitleda22.gcode'
    ]

    expect(input.sort(versionStringCompare)).toEqual([
      'Untitled',
      'Untitled.gcode',
      'Untitled2',
      'Untitled2a',
      'Untitled3',
      'Untitled22',
      'Untitled22.gcode',
      'Untitled22.1gcode',
      'Untitleda22',
      'Untitleda22.gcode',
      'Untitled.1gcode',
      'Untitled.2gcode',
      'Untitled.22.gcode',
      'Untitled_.gcode',
      'Untitled_22',
      'Untitled_22.gcode'
    ])
  })

  it('Can version sort tilde correctly', () => {
    const input = [
      'a',
      '~',
      '~~a',
      '~~'
    ]

    expect(input.sort(versionStringCompare)).toEqual([
      '~~',
      '~~a',
      '~',
      'a'
    ])
  })
})
