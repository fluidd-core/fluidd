import { describe, expect, it } from 'vitest'
import { highlight, rankCommands, score, type Command } from '../rank'

const run = () => {}
const commands: Command[] = [
  { id: 'preheat-pla', group: 'Do', label: 'Preheat PLA on Boxwood', hint: '215° / 60°', words: 'temperature heat', run, suggested: true },
  { id: 'home', group: 'Do', label: 'Home all', words: 'axes', run, suggested: true },
  { id: 'job-octopus', group: 'Jobs', label: 'octopus_brain_keychain_PLA', hint: '53 min', run },
  { id: 'go-jobs', group: 'Go to', label: 'Jobs', keys: ['G', 'J'], run, suggested: true },
  { id: 'go-settings', group: 'Go to', label: 'Settings', run },
  { id: 'printer-walnut', group: 'Printers', label: 'Walnut', hint: 'ready · PLA loaded', run }
]

describe('the command bar', () => {
  it('needs every typed word somewhere in a command', () => {
    expect(score(commands[0], 'pla box')).toBeGreaterThan(0)
    expect(score(commands[0], 'pla walnut')).toBe(0)
  })

  it('finds a command by words it does not show', () => {
    expect(score(commands[1], 'axes')).toBeGreaterThan(0)
  })

  it('ranks a word that starts a word of the label above one inside it', () => {
    expect(score(commands[3], 'jo')).toBeGreaterThan(score(commands[2], 'jo'))
  })

  it('lists the groups in their order, best first in each', () => {
    expect(rankCommands(commands, 'pla').map(c => c.id)).toEqual(['preheat-pla', 'job-octopus', 'printer-walnut'])
  })

  it('suggests a few with nothing typed', () => {
    expect(rankCommands(commands, '').map(c => c.id)).toEqual(['preheat-pla', 'home', 'go-jobs'])
  })

  it('keeps each group short', () => {
    const many: Command[] = Array.from({ length: 9 }, (_, i) => ({ id: `m${i}`, group: 'Macros', label: `MACRO_${i}`, run }))
    expect(rankCommands(many, 'macro', 4)).toHaveLength(4)
  })

  it('takes a typed word as text, not a pattern', () => {
    expect(score(commands[0], '(')).toBe(0)
    expect(score({ id: 'x', group: 'Do', label: 'Speed (100%)', run }, '(100')).toBeGreaterThan(0)
  })

  it('marks the typed words in the label', () => {
    expect(highlight('Preheat PLA on Boxwood', 'pla')).toEqual([
      { text: 'Preheat ', match: false },
      { text: 'PLA', match: true },
      { text: ' on Boxwood', match: false }
    ])
  })
})
