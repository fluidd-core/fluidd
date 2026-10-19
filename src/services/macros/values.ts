import { macroParams } from './arrange'
import { gcodeMacroParamDefault } from '@/util/gcode-macro-params'

export interface MacroField { name: string; optional: boolean; defaultValue: string }

/** Defaults are hints only. Empty optional fields stay out of the command. */
export function macroFields (gcode: string): MacroField[] {
  return macroParams(gcode).params.map(name => {
    const reference = new RegExp(`params\\.${name}\\b(.*)`, 'i').exec(gcode)
    const tail = reference?.[1] ?? ''
    const optional = new RegExp(`params\\.${name}\\s*(?:\\|\\s*default\\(|is\\s+defined)|['"]${name}['"]\\s+in\\s+params`, 'i').test(gcode)
    return { name, optional, defaultValue: /^\s*\|\s*default\(/i.test(tail) ? gcodeMacroParamDefault(tail) : '' }
  })
}

/** Klipper extended parameters are tokens. Refuse syntax rather than escaping a second command. */
export function macroCommand (name: string, fields: MacroField[], values: Record<string, string>): string | null {
  if (!/^[A-Z_][A-Z0-9_]*$/i.test(name) || fields.length > 32) return null
  const parts = [name]
  for (const field of fields) {
    const value = values[field.name] ?? ''
    if (!value) { if (!field.optional) return null; continue }
    if (!/^[A-Z0-9_.:+/-]{1,128}$/i.test(value) || /^(?:nan|[+-]?infinity)$/i.test(value)) return null
    if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value) && !Number.isFinite(Number(value))) return null
    parts.push(`${field.name}=${value}`)
  }
  return parts.join(' ')
}
