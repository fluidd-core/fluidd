import { Component, Vue } from 'vue-property-decorator'
import type { Macro } from '@/store/macros/types'
import type { ConsoleEntry } from '@/store/console/types'
import {
  MACRO_GROUPS,
  arrangeMacros,
  macroUse,
  topMacros,
  type ArrangedMacro,
  type MacroGroupId,
  type MacroSource
} from '@/services/macros/arrange'

/** A macro as the redesign shows it: arranged, with what Settings › Macros says about it. */
export interface ShownMacro extends ArrangedMacro {
  /** The group a person put it in under Settings › Macros, which wins over the automatic one. */
  userGroup: string | null;
  disabledWhilePrinting: boolean;
  color: string;
}

export interface ShownMacroGroup {
  id: string;
  label: string;
  macros: ShownMacro[];
}

/**
 * The printer's macros, arranged (services/macros/arrange.ts) from what
 * Klipper publishes: every gcode_macro's settings, the raw config's other
 * hooks, and what this printer's console has run. A macro hidden under
 * Settings › Macros stays hidden, and a group set there wins.
 */
@Component
export default class MacrosMixin extends Vue {
  get arrangedMacros (): ShownMacro[] {
    const configfile = this.$store.state.printer.printer.configfile ?? {}
    const settings = (configfile.settings ?? {}) as Record<string, Record<string, unknown>>
    const raw = (configfile.config ?? {}) as Record<string, Record<string, unknown>>
    const sources: MacroSource[] = Object.entries(settings)
      .filter(([key]) => key.startsWith('gcode_macro '))
      .map(([key, s]) => ({
        name: key.slice('gcode_macro '.length),
        description: s.description as string | undefined,
        gcode: typeof s.gcode === 'string' ? s.gcode : '',
        renameExisting: (s.rename_existing as string | undefined) || undefined
      }))
    const hooks: string[] = []
    for (const [section, options] of Object.entries(raw)) {
      if (section.startsWith('gcode_macro ')) continue
      for (const [option, value] of Object.entries(options ?? {})) {
        if ((option === 'gcode' || option.endsWith('_gcode')) && typeof value === 'string') hooks.push(value)
      }
    }
    const entries = this.$store.state.console.console as ConsoleEntry[]
    const sent = [
      ...entries.filter(e => e.type === 'command').map(e => e.message),
      ...(this.$store.state.console.commandHistory as string[])
    ]
    const used = macroUse(sent, sources.map(s => s.name))
    const stored = new Map((this.$store.getters['macros/getMacros'] as Macro[]).map(m => [m.name.toUpperCase(), m]))
    return arrangeMacros(sources, hooks, used)
      .filter(m => !m.name.startsWith('_'))
      .flatMap(m => {
        const s = stored.get(m.name)
        if (s && !s.visible) return []
        return [{
          ...m,
          userGroup: s?.category?.name ?? null,
          disabledWhilePrinting: !!s?.disabledWhilePrinting,
          color: s?.color ?? ''
        }]
      })
  }

  /** The groups in order, each sorted best first; groups set under Settings › Macros come first. */
  get macroGroups (): ShownMacroGroup[] {
    const groups: ShownMacroGroup[] = []
    const userGroups = [...new Set(this.arrangedMacros.map(m => m.userGroup).filter((g): g is string => !!g))].sort()
    for (const label of userGroups) {
      groups.push({ id: `user:${label}`, label, macros: this.arrangedMacros.filter(m => m.userGroup === label) })
    }
    for (const g of MACRO_GROUPS) {
      const macros = this.arrangedMacros.filter(m => !m.userGroup && m.group === g.id)
      if (macros.length) groups.push({ id: g.id, label: g.label, macros })
    }
    return groups.map(g => ({ ...g, macros: [...g.macros].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)) }))
  }

  /** The few to put first, a couple from each group. */
  topMacroList (count: number): ShownMacro[] {
    return topMacros(this.arrangedMacros, count) as ShownMacro[]
  }

  macroGroupLabel (id: MacroGroupId): string {
    return MACRO_GROUPS.find(g => g.id === id)?.label ?? id
  }
}
