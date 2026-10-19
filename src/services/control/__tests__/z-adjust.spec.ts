import { expect, it } from 'vitest'
import { zAdjustCommand } from '../z-adjust'
it.each([
  [-0.01, true, 'SET_GCODE_OFFSET Z_ADJUST=-0.01 MOVE=1'],
  [0.01, true, 'SET_GCODE_OFFSET Z_ADJUST=+0.01 MOVE=1'],
  [0.05, false, 'SET_GCODE_OFFSET Z_ADJUST=+0.05 MOVE=0'],
  [NaN, true, '']
] as const)('formats the shared Z adjust %s with homed=%s', (by, homed, expected) => {
  expect(zAdjustCommand(by, homed)).toBe(expected)
})
