import { encodeGcodeParamValue } from './gcode-helpers'

/**
 * Build the G-code command for setting a controllable fan's speed.
 *
 * Display-only guarantee (AC4): the emitted command references the raw Klipper
 * object `name`, NEVER the display alias / `prettyName`. Aliases are cosmetic.
 *
 * @param fan         Fan type + raw Klipper name (`{ type, name }`).
 * @param sliderValue The 0-100 slider value.
 * @returns The G-code string, or undefined for non-controllable fan types.
 */
export const buildFanSpeedGcode = (
  fan: { type: string; name: string },
  sliderValue: number
): string | undefined => {
  // Part fan: absolute 0-255 M106.
  if (fan.type === 'fan') {
    return `M106 S${Math.ceil(sliderValue * 2.55)}`
  }

  // Generic fan: SET_FAN_SPEED with a 0-1 fraction, keyed by the raw name.
  if (fan.type === 'fan_generic') {
    return `SET_FAN_SPEED FAN=${encodeGcodeParamValue(fan.name)} SPEED=${sliderValue / 100}`
  }

  return undefined
}

/**
 * Build the G-code command for setting an output pin's value.
 *
 * Display-only guarantee (AC4): keyed by the raw Klipper `name`, never the alias.
 */
export const buildSetPinGcode = (name: string, value: number): string =>
  `SET_PIN PIN=${encodeGcodeParamValue(name)} VALUE=${value}`
