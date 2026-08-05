import { buildFanSpeedGcode, buildSetPinGcode } from '../output-gcode'

// AC4 (display-only): every emitted command must be keyed by the raw Klipper
// `name`, never a user-supplied alias / prettyName.

describe('buildFanSpeedGcode', () => {
  it('emits an absolute M106 for the part fan (no name leaks in)', () => {
    expect(buildFanSpeedGcode({ type: 'fan', name: 'fan' }, 100)).toBe('M106 S255')
  })

  it('emits SET_FAN_SPEED keyed by the raw name for a generic fan', () => {
    const gcode = buildFanSpeedGcode({ type: 'fan_generic', name: 'fan2' }, 50)
    expect(gcode).toBe('SET_FAN_SPEED FAN=fan2 SPEED=0.5')
  })

  it('uses the raw name even when a display alias exists on the row', () => {
    // The builder only ever sees `name`; the alias ("Side Fan") is not an input.
    const gcode = buildFanSpeedGcode({ type: 'fan_generic', name: 'fan2' }, 100)
    expect(gcode).toContain('FAN=fan2')
    expect(gcode).not.toContain('Side Fan')
  })

  it('returns undefined for a non-controllable fan type', () => {
    expect(buildFanSpeedGcode({ type: 'temperature_fan', name: 'x' }, 100)).toBeUndefined()
  })
})

describe('buildSetPinGcode', () => {
  it('emits SET_PIN keyed by the raw pin name, never the alias', () => {
    const gcode = buildSetPinGcode('fan2', 0.5)
    expect(gcode).toBe('SET_PIN PIN=fan2 VALUE=0.5')
    expect(gcode).not.toContain('Side Fan')
  })
})
