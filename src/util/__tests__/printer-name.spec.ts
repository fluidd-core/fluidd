import { describe, expect, test } from 'vitest'
import { printerNameParts } from '../printer-name'
import { shortDuration } from '../short-duration'

describe('a printer name, as the frame shows it', () => {
  test.each([
    ['muon-boxwood-367a', 'Boxwood', '367A'],
    ['MUON-Walnut-8987', 'Walnut', '8987'],
    ['muon-workshop-one-1c04', 'Workshop One', '1C04'],
    ['boxwood-367a', 'Boxwood', '367A'],
    ['Ender 3 V2', 'Ender 3 V2', null],
    ['Voron-2.4', 'Voron-2.4', null],
    ['Workshop-ABCD', 'Workshop-ABCD', null],
    ['  muon-maple-1c04 ', 'Maple', '1C04']
  ])('%s is %s', (raw, name, suffix) => {
    expect(printerNameParts(raw)).toEqual({ name, suffix })
  })
})

describe('a short duration', () => {
  test.each([
    [20, '1m'],
    [14 * 60, '14m'],
    [59 * 60 + 40, '1h'],
    [2 * 3600 + 5 * 60, '2h 5m']
  ])('%s s is %s', (seconds, text) => {
    expect(shortDuration(seconds)).toBe(text)
  })
})
