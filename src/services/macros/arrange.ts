/**
 * The printer's macros, arranged for people: each in a group by what it is
 * for, the ones you'd press first at the top, and the ones the printer runs
 * by itself (prompt buttons, event hooks, overrides of standard G-code) set
 * aside. Worked out from what any Klipper printer publishes (each macro's
 * name, description and G-code, and the config's other *_gcode hooks), so
 * it arranges every printer, not one in particular.
 */

export type MacroGroupId =
  'filament' | 'moving' | 'nozzle' | 'calibration' | 'lights' | 'fans' | 'printing' | 'other' | 'printer'

export const MACRO_GROUPS: Array<{ id: MacroGroupId, label: string }> = [
  { id: 'filament', label: 'Filament' },
  { id: 'moving', label: 'Moving' },
  { id: 'nozzle', label: 'Nozzle' },
  { id: 'calibration', label: 'Calibration' },
  { id: 'lights', label: 'Lights' },
  { id: 'fans', label: 'Fans' },
  { id: 'printing', label: 'Printing' },
  { id: 'other', label: 'Other' },
  { id: 'printer', label: 'Run by the printer itself' }
]

/** What the arranging reads of a macro. */
export interface MacroSource {
  /** As Klipper names it, any case. */
  name: string;
  description?: string;
  gcode?: string;
  /** Set when the macro replaces a standard command (G28, M106, PAUSE). */
  renameExisting?: string;
}

export interface ArrangedMacro {
  name: string;
  /** "Load filament" for LOAD_FILAMENT. */
  title: string;
  description: string;
  group: MacroGroupId;
  /** Why it is in "Run by the printer itself", or ''. */
  internal: string;
  /** The parameters it reads, and whether any of them has no default (then one press can't run it). */
  params: string[];
  needsParams: boolean;
  /** Other macros run it: a building block more than a button. */
  calledByOthers: boolean;
  /** Higher first. */
  score: number;
}

const RULES: Array<[MacroGroupId, RegExp]> = [
  ['lights', /(^|_)(LEDS?|LIGHTS?|NEOPIXEL|CASELIGHT)(_|$)/],
  ['fans', /(^|_)FANS?(_|$)|^M10[67]$/],
  ['calibration', /CALIBRAT|(^|_)(PID|SHAPER|RESONANCE|MESH|PROBE|Z_?OFFSET|TILT|SKEW|ACCURACY|TUNE)(_|$)/],
  ['filament', /FILAMENT|(^|_)(LOAD|UNLOAD|PURGE|PRIME|CUT|SPOOL|EXTRUDE|RETRACT|M600|M701|M702)(_|$)/],
  ['nozzle', /(^|_)(NOZZLE|CLEAN|WIPE|BRUSH|DOCK|OOZE)(_|$)/],
  ['moving', /(^|_)(HOME|HOMING|G28|PARK|CENTER|CENTRE|FRONT|BACK|MOVE|JOG|RAISE|LOWER|STOW)(_|$)|^C?HOME$|^Z_/],
  ['printing', /(^|_)(PRINT|START|END|PAUSE|RESUME|CANCEL|M0|M1)(_|$)/]
]

/** Names that start with a plain verb are the ones people look for: LOAD_FILAMENT, PARK, CLEAN_NOZZLE; the everyday ones most. */
const EVERYDAY_VERB = /^(LOAD|UNLOAD|PURGE|CLEAN|PARK|HOME|PREHEAT)(_|$)/
const VERB = /^(PRIME|WIPE|CENTER|CENTRE|LEVEL|CALIBRATE|HEAT|COOL|CUT)(_|$)/

const WEIGHT: Record<MacroGroupId, number> = {
  filament: 40, moving: 30, nozzle: 30, calibration: 20, lights: 12, fans: 8, other: 10, printing: 0, printer: -100
}

/** "LOAD_FILAMENT" → "Load filament"; "Z_PARK" → "Z park"; G-code names stay as they are. */
export function macroTitle (name: string): string {
  const upper = name.toUpperCase()
  if (/^[GM]\d+(\.\d+)?$/.test(upper)) return upper
  const words = upper.split('_').filter(Boolean).map(w => w.toLowerCase())
  if (!words.length) return upper
  const out = words.map(w => (/^[a-z]$/.test(w) || /^(led|pid|psu|cpu|tpu|pla|abs|petg|usb|mcu|md)$/.test(w) ? w.toUpperCase() : w))
  out[0] = out[0].charAt(0).toUpperCase() + out[0].slice(1)
  return out.join(' ')
}

/** Its description, unless it is Klipper's placeholder "G-Code macro"; quotes a config left on it are dropped. */
export function macroDescription (description: unknown): string {
  const text = typeof description === 'string' ? description.trim().replace(/^"+|"+$/g, '').trim() : ''
  return /^g-?code macro$/i.test(text) ? '' : text
}

/** The parameters a macro reads (params.TEMP), and whether one has no default. */
export function macroParams (gcode: string): { params: string[], needsParams: boolean } {
  const seen = new Map<string, boolean>()
  const re = /params\.([A-Z_][A-Z0-9_]*)(\s*\|\s*default\()?/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(gcode))) {
    const name = m[1].toUpperCase()
    seen.set(name, (seen.get(name) ?? false) || !!m[2])
  }
  // params.X is defined only when the caller passes it; a template that tests
  // "if params.X" first treats it as optional.
  const optional = (p: string) => seen.get(p) || new RegExp(`params\\.${p}\\s+is\\s+defined|['"]${p}['"]\\s+in\\s+params`, 'i').test(gcode)
  const params = [...seen.keys()]
  return { params, needsParams: params.some(p => !optional(p)) }
}

const wordIn = (name: string, text: string) => new RegExp(`(^|[^A-Za-z0-9_])${name}([^A-Za-z0-9_]|$)`, 'i').test(text)

/**
 * Why a macro is the printer's own business, or '': a button on one of the
 * printer's prompts, a hook another part of the config runs (a sensor's
 * insert_gcode, a button's press_gcode), a replacement for a standard
 * command that has its own control, or one that says it is called by
 * something.
 */
export function internalReason (macro: MacroSource, hooks: string[], prompts: string[]): string {
  const name = macro.name.toUpperCase()
  if (prompts.some(p => wordIn(name, p))) return 'A button on one of the printer\'s prompts'
  if (hooks.some(h => wordIn(name, h))) return 'Runs when something on the printer happens'
  if (macro.renameExisting) return `Replaces ${name}, which runs as usual`
  const description = macroDescription(macro.description)
  if (/^(called|runs?|internal|used) (when|by|on|from)\b|^internal\b|\b(called|triggered|triggers?|runs|fires|invoked)\b.*\bwhen\b/i.test(description)) return description
  if (/(^|_)(PROMPT|CLOSE|GATE|RESULT|STATE|CALLBACK)$/.test(name)) return 'A step of another macro'
  if (/(^|_)(PRE|POST|BEFORE|AFTER)(_|$)/.test(name)) return 'A step of printing'
  return ''
}

/** The buttons the printer's prompts offer: "...prompt_footer_button Resume|_BED_RESUME_NOW|primary". */
export function promptTargets (gcodes: string[]): string[] {
  const out: string[] = []
  for (const gcode of gcodes) {
    const re = /prompt_(?:footer_)?button\s[^|"\n]*\|\s*([A-Za-z_][A-Za-z0-9_]*)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(gcode))) out.push(m[1])
  }
  return out
}

/** The aliases among the macros: one that says it is an alias of another, keyed by the one it stands for. */
function aliasesOf (macros: MacroSource[]): Map<string, string[]> {
  const byName = new Set(macros.map(m => m.name.toUpperCase()))
  const out = new Map<string, string[]>()
  for (const m of macros) {
    const target = /alias (?:for|of) ([A-Za-z_][A-Za-z0-9_]*)/i.exec(macroDescription(m.description))?.[1]?.toUpperCase()
    if (target && byName.has(target)) out.set(target, [...(out.get(target) ?? []), m.name.toUpperCase()])
  }
  return out
}

/**
 * Every macro arranged: its group, its title, and its score. `hooks` are
 * the config's other *_gcode values (not macros'), and `used` how often
 * each was run lately, by name.
 */
export function arrangeMacros (macros: MacroSource[], hooks: string[], used: Record<string, number> = {}): ArrangedMacro[] {
  const prompts = promptTargets(macros.map(m => m.gcode ?? '')).map(n => n.toUpperCase())
  const aliases = aliasesOf(macros)
  // Of a macro and its aliases, the shortest name a person would type stays
  // (LOAD_FILAMENT over FILAMENT_INSERT_FLOW, never a _hidden one); the rest
  // join the printer's.
  const shadowed = new Map<string, string>()
  for (const [target, names] of aliases) {
    const hidden = (n: string) => (n.startsWith('_') ? 1 : 0)
    const keep = [target, ...names].sort((a, b) => hidden(a) - hidden(b) || a.length - b.length || a.localeCompare(b))[0]
    for (const n of [target, ...names]) if (n !== keep) shadowed.set(n, keep)
  }
  const hookText = hooks.map(h => h.replace(/\{[%#][\s\S]*?[%#]\}/g, ' '))
  const words = macros.map(m => new Set((m.gcode ?? '').toUpperCase().match(/[A-Z_][A-Z0-9_]*/g) ?? []))
  return macros.map((m, i) => {
    const name = m.name.toUpperCase()
    const description = macroDescription(m.description)
    const { params, needsParams } = macroParams(m.gcode ?? '')
    const reason = shadowed.has(name) ? `The same as ${shadowed.get(name)}` : internalReason(m, hookText, prompts)
    const group: MacroGroupId = reason ? 'printer' : (RULES.find(([, re]) => re.test(name))?.[0] ?? 'other')
    const runs = used[name] ?? 0
    const calledByOthers = words.some((w, j) => j !== i && w.has(name))
    // A G-code number (M600) is usually the slicer's to send.
    const gcodeNumber = /^[GM]\d+(\.\d+)?$/.test(name)
    const score = WEIGHT[group] + (description ? 5 : 0) + (needsParams ? -15 : 0) + (EVERYDAY_VERB.test(name) ? 8 : VERB.test(name) ? 4 : 0) +
      (calledByOthers ? -8 : 0) + (gcodeNumber ? -20 : 0) + Math.min(40, runs * 8)
    return { name, title: macroTitle(name), description, group, internal: reason, params, needsParams, calledByOthers, score }
  })
}

/** The macros to put first: the best of each group in turn, so one group doesn't fill the row; never the printer's own. */
export function topMacros (arranged: ArrangedMacro[], count: number): ArrangedMacro[] {
  const ranked = arranged.filter(m => m.group !== 'printer' && m.group !== 'printing').sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  const out: ArrangedMacro[] = []
  const perGroup = new Map<MacroGroupId, number>()
  for (let cap = 2; out.length < count && cap <= count; cap++) {
    for (const m of ranked) {
      if (out.length >= count) break
      if (out.includes(m)) continue
      if ((perGroup.get(m.group) ?? 0) >= cap) continue
      out.push(m)
      perGroup.set(m.group, (perGroup.get(m.group) ?? 0) + 1)
    }
  }
  return out
}

/** How often each macro was run lately: lines the console sent, and the commands typed. */
export function macroUse (sent: string[], names: string[]): Record<string, number> {
  const known = new Set(names.map(n => n.toUpperCase()))
  const out: Record<string, number> = {}
  for (const line of sent) {
    const word = line.trim().split(/\s+/)[0]?.toUpperCase()
    if (word && known.has(word)) out[word] = (out[word] ?? 0) + 1
  }
  return out
}
