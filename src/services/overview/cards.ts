export interface OverviewCapabilities {
  temperatures: boolean; control: boolean; queue: boolean; camera: boolean;
  macros: boolean; nativeConnection: boolean; bedMesh: boolean; calibration: boolean;
  diagnostics: boolean; objects: boolean; filament: boolean;
}
type OverviewCapability = keyof OverviewCapabilities
export interface OverviewCard { id: string; title: string; size: 'wide' | 'normal'; needs: string; when: 'always' | 'idle' | 'printing'; capability: OverviewCapability; unavailable: string }
export const overviewCards: OverviewCard[] = [
  { id: 'temperatures', title: 'Temperatures', size: 'wide', needs: 'temperature sensors', when: 'always', capability: 'temperatures', unavailable: 'No temperature sensors are reported.' },
  { id: 'quick-actions', title: 'Quick actions', size: 'normal', needs: 'printer control', when: 'idle', capability: 'control', unavailable: 'Connect to a printer you can control first.' },
  { id: 'queue', title: 'Up next', size: 'normal', needs: 'job_queue', when: 'always', capability: 'queue', unavailable: 'This printer does not provide a job queue.' },
  { id: 'live-tune', title: 'Live tune', size: 'normal', needs: 'printer control', when: 'always', capability: 'control', unavailable: 'Connect to a printer you can control first.' },
  { id: 'camera', title: 'Camera', size: 'normal', needs: 'configured camera', when: 'always', capability: 'camera', unavailable: 'No camera is configured.' },
  { id: 'macros', title: 'Macros', size: 'normal', needs: 'gcode macros', when: 'always', capability: 'macros', unavailable: 'This printer does not provide any G-code macros.' },
  { id: 'console', title: 'Console', size: 'wide', needs: 'native Moonraker connection', when: 'always', capability: 'nativeConnection', unavailable: 'Console needs a direct Moonraker connection.' },
  { id: 'bed', title: 'Bed', size: 'normal', needs: 'bed_mesh', when: 'always', capability: 'bedMesh', unavailable: 'This printer does not report bed_mesh.' },
  { id: 'checks', title: 'Checks', size: 'normal', needs: 'calibration commands', when: 'always', capability: 'calibration', unavailable: 'No calibration commands are reported.' },
  { id: 'chart', title: 'Chart', size: 'wide', needs: 'diagnostics recording and a configured chart', when: 'always', capability: 'diagnostics', unavailable: 'Turn on Diagnostics and configure a chart first.' },
  { id: 'objects', title: 'Objects', size: 'normal', needs: 'exclude_object', when: 'printing', capability: 'objects', unavailable: 'Object exclusion is not available on this printer.' },
  { id: 'spool', title: 'Spool', size: 'normal', needs: 'filament information', when: 'always', capability: 'filament', unavailable: 'No filament information is available.' }
]

export function cardUnavailable (id: string, capabilities: OverviewCapabilities): string | undefined {
  const card = overviewCards.find(card => card.id === id)
  return card && !capabilities[card.capability] ? card.unavailable : undefined
}

/** Fixed stage, current print and its actions are deliberately outside this list. */
export function cardLayout (value: unknown): string[] {
  if (value === null || value === undefined) return ['temperatures', 'quick-actions', 'queue']
  if (!Array.isArray(value)) return cardLayout(null)
  return [...new Set(value.filter(id => typeof id === 'string' && overviewCards.some(c => c.id === id)))]
}

export function moveCard (value: string[], id: string, by: number): string[] {
  const next = cardLayout(value)
  const index = next.indexOf(id)
  const target = index + by
  if (index >= 0 && target >= 0 && target < next.length) next.splice(target, 0, ...next.splice(index, 1))
  return next
}
