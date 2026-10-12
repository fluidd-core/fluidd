/**
 * Where each macro is written: the file and line of its [gcode_macro NAME]
 * section, so Edit opens the editor there. The printer's config files are
 * read as text; backups (a backups/ folder) are left out.
 */

export interface MacroPlace {
  /** The root it was found in: `config` (the copy developer mode edits) or `defaults`. */
  root: string;
  /** Its path inside that root: macros/filament.cfg. */
  path: string;
  /** 1-based. */
  line: number;
}

const SECTION = /^\s*\[\s*gcode_macro\s+([^\]\s]+)\s*\]/i

/** Every [gcode_macro NAME] in one file, by name in capitals. */
export function macroSections (content: string): Map<string, number> {
  const out = new Map<string, number>()
  content.split(/\r?\n/).forEach((line, i) => {
    const m = SECTION.exec(line)
    if (m && !out.has(m[1].toUpperCase())) out.set(m[1].toUpperCase(), i + 1)
  })
  return out
}

/** The files worth reading: Klipper config under the root, not backups, not huge. */
export function configFilesToRead (files: Array<{ path: string, size?: number }>): string[] {
  return files
    .filter(f => /\.cfg$/i.test(f.path) && !/(^|\/)backups?\//i.test(f.path) && (f.size ?? 0) < 512 * 1024)
    .map(f => f.path)
    .sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b))
}

/** Where every macro is: the first file (shallowest, then A-Z) that defines it wins, as Klipper's include order would be ambiguous. */
export function macroPlaces (root: string, files: Array<{ path: string, content: string }>): Map<string, MacroPlace> {
  const out = new Map<string, MacroPlace>()
  for (const f of files) {
    for (const [name, line] of macroSections(f.content)) {
      if (!out.has(name)) out.set(name, { root, path: f.path, line })
    }
  }
  return out
}
