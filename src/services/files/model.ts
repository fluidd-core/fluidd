/** How Files shows one of the printer's folders (Moonraker's roots). */
export interface RootGroup {
  title: string;
  note: string;
  /** Logs are downloaded, not opened: they run to megabytes. */
  download: boolean;
}

/**
 * MuonOS keeps each printer's own calibration and settings in
 * `calibration` (writable) and the shipped M1 config in `defaults` (read
 * only); `config` shows only in dev mode.
 */
export function rootGroup (root: string): RootGroup {
  switch (root) {
    case 'calibration': return { title: 'This printer\'s settings', note: 'editable', download: false }
    case 'defaults': return { title: 'Muon3D defaults', note: 'read only · they come with updates', download: false }
    case 'config': return { title: 'The whole config', note: 'dev mode', download: false }
    case 'logs': return { title: 'Logs', note: 'download to read', download: true }
    case 'docs': return { title: 'Docs', note: 'read only', download: false }
    default: return { title: root.charAt(0).toUpperCase() + root.slice(1).replace(/_/g, ' '), note: '', download: false }
  }
}

/** The order Files lists its folders in: the printer's own first. */
export function orderRoots (roots: string[]): string[] {
  const first = ['config', 'calibration', 'defaults', 'logs', 'docs']
  const rank = (r: string) => (first.includes(r) ? first.indexOf(r) : first.length)
  return [...roots].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

const TEXT = /\.(cfg|conf|txt|md|json|ya?ml|ini|py|sh|log|csv|toml)$/i

/** Opened in the editor: text files under 2 MB. The rest download. */
export function opensInEditor (name: string, size: number): boolean {
  return TEXT.test(name) && size <= 2_000_000
}

/** What restarting after a save stops, and whether now's a good time. */
export function restartNote (service: string | null, printerName: string, printing: boolean): string {
  if (!service) return ''
  const what = service === 'klipper' ? 'Klipper' : service === 'moonraker' ? 'Moonraker' : service
  if (service !== 'klipper') return `Saving and restarting restarts ${what}.`
  return printing
    ? `Restarting Klipper stops a print. ${printerName} is printing: save now, and restart once it's done.`
    : `Restarting Klipper stops a print. ${printerName} isn't printing, so it's safe now.`
}

/** Lines that differ between what's saved and what's in the editor, counted simply line by line. */
export function changedLines (saved: string, edited: string): number {
  const a = saved.split('\n')
  const b = edited.split('\n')
  let changed = Math.abs(a.length - b.length)
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) changed++
  return changed
}

/** A name a file or folder can take here: no slashes, not empty, not dot or dot-dot. */
export function validName (name: string): boolean {
  const n = name.trim()
  return !!n && n !== '.' && n !== '..' && !/[\\/]/.test(n)
}
