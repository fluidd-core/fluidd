/** The command bar's groups, in the order they show. */
export const GROUPS = ['Do', 'Jobs', 'Macros', 'Go to', 'Printers'] as const

export type CommandGroup = typeof GROUPS[number]

export interface Command {
  id: string;
  group: CommandGroup;
  /** What it does, in words: "Preheat PLA on Boxwood". */
  label: string;
  /** Beside it, quieter: "215° / 60°". */
  hint?: string;
  /** Words it answers to that it doesn't show: "temperature heat". */
  words?: string;
  /** Its keys, shown on the right: ["G", "J"]. */
  keys?: string[];
  /** What Enter does, on the right when it has no keys: "Print", "Open". */
  verb?: string;
  icon?: string;
  /** Shown with nothing typed yet. */
  suggested?: boolean;
  run: () => void | Promise<void>;
}

export interface Segment {
  text: string;
  match: boolean;
}

function tokens (query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean)
}

/**
 * How well a command answers what was typed: every word must be found in
 * its label, hint or words. A word that starts a word of the label scores
 * most, then anywhere in the label, then the hint or words. Zero is no.
 */
export function score (command: Command, query: string): number {
  const words = tokens(query)
  if (!words.length) return command.suggested ? 1 : 0
  const label = command.label.toLowerCase()
  const rest = `${command.hint ?? ''} ${command.words ?? ''}`.toLowerCase()
  let total = 0
  for (const word of words) {
    if (new RegExp(`(^|[^a-z0-9])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(label)) total += 3
    else if (label.includes(word)) total += 2
    else if (rest.includes(word)) total += 1
    else return 0
  }
  if (label.startsWith(words[0])) total += 1
  return total
}

/**
 * The commands that answer `query`, best first within each group, the
 * groups in their order, at most `perGroup` of each.
 */
export function rankCommands (commands: Command[], query: string, perGroup = 4): Command[] {
  const out: Command[] = []
  for (const group of GROUPS) {
    const scored = commands
      .filter(c => c.group === group)
      .map((c, i) => ({ c, s: score(c, query), i }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s || a.i - b.i)
      .slice(0, perGroup)
    out.push(...scored.map(x => x.c))
  }
  return out
}

/** The label in pieces, the typed words marked, to show them bold. */
export function highlight (label: string, query: string): Segment[] {
  const words = tokens(query)
  if (!words.length) return [{ text: label, match: false }]
  const lower = label.toLowerCase()
  const marked = new Array<boolean>(label.length).fill(false)
  for (const word of words) {
    let at = lower.indexOf(word)
    while (at !== -1) {
      for (let i = at; i < at + word.length; i++) marked[i] = true
      at = lower.indexOf(word, at + word.length)
    }
  }
  const segments: Segment[] = []
  for (let i = 0; i < label.length; i++) {
    const last = segments[segments.length - 1]
    if (last && last.match === marked[i]) last.text += label[i]
    else segments.push({ text: label[i], match: marked[i] })
  }
  return segments
}
