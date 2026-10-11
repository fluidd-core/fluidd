import type { ConsoleEntry, GcodeHelp } from '@/store/console/types'

export type EntryKind = 'command' | 'error' | 'warning' | 'info'

export type LogFilter = 'all' | 'commands' | 'warnings' | 'errors'

/** A console line's text: the store keeps sanitised HTML, with <br /> for line breaks. */
export function entryText (message: string): string {
  return message
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

/** Klipper starts an error with !!; a warning says so. */
export function entryKind (entry: Pick<ConsoleEntry, 'message' | 'type'>): EntryKind {
  if (entry.type === 'command') return 'command'
  const text = entryText(entry.message)
  if (text.startsWith('!!')) return 'error'
  if (/\bwarn(ing)?\b/i.test(text)) return 'warning'
  return 'info'
}

/** The lines a filter and a search keep, in order. Warnings include errors: both want a look. */
export function filterEntries<T extends Pick<ConsoleEntry, 'message' | 'type'>> (entries: T[], filter: LogFilter, find: string): T[] {
  const q = find.trim().toLowerCase()
  return entries.filter(e => {
    const kind = entryKind(e)
    if (filter === 'commands' && kind !== 'command') return false
    if (filter === 'warnings' && kind !== 'warning' && kind !== 'error') return false
    if (filter === 'errors' && kind !== 'error') return false
    return !q || entryText(e.message).toLowerCase().includes(q)
  })
}

const EXPLAINED: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/Must home axis first/i, () => 'Home the printer first: Home all on Control, or G28.'],
  [/Move out of range/i, () => 'A move went past the printer\'s limits. Check the coordinates, or home again.'],
  [/TMC '([^']+)' reports/i, m => `The ${m[1].replace(/^stepper_/, '').toUpperCase()} motor driver saw a fault. One that clears is harmless; if it keeps happening, check that motor's cable.`],
  [/Heater (\S+) not heating at expected rate/i, m => `The ${m[1] === 'extruder' ? 'nozzle' : m[1].replace(/_/g, ' ')} heated slower than expected, so Klipper shut down to be safe. Check its heater and thermistor wiring, and that no fan blows on it.`],
  [/Lost communication with MCU/i, () => 'Klipper lost touch with a control board. Check its cable and power, then Firmware restart.'],
  [/Timer too close/i, () => 'The computer fell behind the control board, usually because it was busy. Firmware restart, and if it repeats, look at what else is running.'],
  [/Extrude below minimum temp/i, () => 'The nozzle is too cold to push filament. Heat it first.'],
  [/ADC out of range/i, () => 'A temperature reading went out of range: often a loose thermistor, or a heater running too hot. Check the wiring before heating again.'],
  [/Unknown command:?\s*"?([A-Za-z0-9_]+)"?/, m => `Klipper doesn't know ${m[1].toUpperCase()}. Check the spelling, or whether a macro by that name is installed.`]
]

/** What a common Klipper error or warning means, in a sentence; null for the rest. */
export function explain (message: string): string | null {
  const text = entryText(message)
  for (const [pattern, say] of EXPLAINED) {
    const m = text.match(pattern)
    if (m) return say(m)
  }
  return null
}

export interface Suggestion {
  /** What Tab puts in the line. */
  text: string;
  hint: string;
  from: 'history' | 'command';
}

/**
 * What the line could become: commands sent before that start with what's
 * typed (newest first, each once, with how often), then, while the first
 * word is being typed, Klipper's commands that start with it, with their
 * help.
 */
export function suggestions (typed: string, commands: GcodeHelp, history: string[], limit = 6): Suggestion[] {
  const line = typed.trimStart()
  if (!line) return []
  const lower = line.toLowerCase()
  const counts = new Map<string, number>()
  for (const h of history) counts.set(h, (counts.get(h) ?? 0) + 1)
  const fromHistory: Suggestion[] = [...counts.keys()]
    .filter(h => h.toLowerCase().startsWith(lower) && h.toLowerCase() !== lower)
    .map(h => ({ text: h, hint: counts.get(h)! > 1 ? `used ${counts.get(h)} times` : 'used before', from: 'history' as const }))
  const word = line.split(/\s/)[0].toUpperCase()
  const typingWord = !/\s/.test(line)
  const sentAlready = new Set(fromHistory.map(h => h.text.toUpperCase()))
  const fromCommands: Suggestion[] = typingWord
    ? Object.keys(commands)
      .filter(c => c.toUpperCase().startsWith(word) && c.toUpperCase() !== word && !sentAlready.has(c.toUpperCase()))
      .sort((a, b) => a.length - b.length || a.localeCompare(b))
      .map(c => ({ text: c.toUpperCase(), hint: commands[c] ?? '', from: 'command' as const }))
    : []
  return [...fromHistory, ...fromCommands].slice(0, limit)
}

/** The help for the command being typed, once its name is complete. */
export function commandHelp (typed: string, commands: GcodeHelp): string | null {
  const word = typed.trim().split(/\s/)[0]?.toUpperCase()
  if (!word) return null
  const key = Object.keys(commands).find(c => c.toUpperCase() === word)
  return key ? (commands[key] || null) : null
}
