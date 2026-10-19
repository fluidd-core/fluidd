export interface OverviewCard { id: string; title: string; size: 'wide' | 'normal'; needs: string; when: 'always' | 'idle' | 'printing' }
export const overviewCards: OverviewCard[] = [
  { id: 'temperatures', title: 'Temperatures', size: 'wide', needs: 'temperature sensors', when: 'always' },
  { id: 'quick-actions', title: 'Quick actions', size: 'normal', needs: 'printer control', when: 'idle' },
  { id: 'queue', title: 'Up next', size: 'normal', needs: 'job_queue', when: 'always' },
  { id: 'live-tune', title: 'Live tune', size: 'normal', needs: 'printer control', when: 'always' },
  { id: 'camera', title: 'Camera', size: 'normal', needs: 'configured camera', when: 'always' },
  { id: 'macros', title: 'Macros', size: 'normal', needs: 'gcode macros', when: 'always' },
  { id: 'console', title: 'Console', size: 'wide', needs: 'native Moonraker connection', when: 'always' },
  { id: 'bed', title: 'Bed', size: 'normal', needs: 'bed_mesh', when: 'always' },
  { id: 'checks', title: 'Checks', size: 'normal', needs: 'calibration commands', when: 'always' },
  { id: 'chart', title: 'Chart', size: 'wide', needs: 'diagnostics recording and a configured chart', when: 'always' },
  { id: 'objects', title: 'Objects', size: 'normal', needs: 'exclude_object', when: 'printing' },
  { id: 'spool', title: 'Spool', size: 'normal', needs: 'filament information', when: 'always' }
]

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
