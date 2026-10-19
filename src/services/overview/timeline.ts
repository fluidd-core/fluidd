import type { ChartPoint } from './model'
export interface Observation { context: string; layer?: number; paused?: boolean; duration?: number; filament: Record<string, boolean> }
export function retainedSamples (payload: Record<string, Record<string, unknown[]>>, now: number, retention: number): ChartPoint[] {
  const entries = Object.entries(payload ?? {}).filter(([, fields]) => Array.isArray(fields?.temperatures))
  const count = Math.min(Math.max(0, Math.floor(retention)), Math.max(0, ...entries.map(([, fields]) => fields.temperatures.length)))
  return Array.from({ length: count }, (_, i) => {
    const point: ChartPoint = { date: new Date(now - (count - i) * 1000) }
    for (const [key, fields] of entries) {
      for (const [field, suffix] of [['temperatures', ''], ['targets', 'Target'], ['powers', 'Power'], ['speeds', 'Speed']]) {
        if (field === 'targets' && /^(temperature_probe|temperature_sensor)/.test(key)) continue
        const values = fields[field]
        const value = Array.isArray(values) ? values[values.length - count + i] : undefined
        if (typeof value === 'number' && Number.isFinite(value)) point[key + suffix] = value
      }
    }
    return point
  })
}

export function sampleAt (points: ChartPoint[], at: number): ChartPoint | null {
  const closest = points.filter(p => Number.isFinite(p.date.getTime())).reduce<ChartPoint | null>((best, p) => !best || Math.abs(p.date.getTime() - at) < Math.abs(best.date.getTime() - at) ? p : best, null)
  return closest && Math.abs(closest.date.getTime() - at) <= 750 && Object.values(closest).some(v => typeof v === 'number' && Number.isFinite(v)) ? closest : null
}

export function historyPath (points: ChartPoint[], key: string, from: number, to: number, width: number, y: (v: number) => number): string {
  let previous: number | null = null
  const path: string[] = []
  for (const p of points) {
    const at = p.date.getTime()
    const value = p[key]
    if (!Number.isFinite(at) || at < from || at > to || typeof value !== 'number' || !Number.isFinite(value)) { previous = null; continue }
    path.push(`${previous === null || at < previous || at - previous > 2500 ? 'M' : 'L'}${((at - from) / Math.max(1, to - from) * width).toFixed(1)} ${y(value).toFixed(1)}`)
    previous = at
  }
  return path.join(' ')
}

export function observedEvents (previous: Observation | null, current: Observation, at: number): Array<{ at: number; label: string }> {
  if (!previous || previous.context !== current.context) return []
  const events: Array<{ at: number; label: string }> = []
  if (Number.isInteger(current.layer) && current.layer! > 0 && current.layer !== previous.layer) events.push({ at, label: `Layer ${current.layer}` })
  if (typeof previous.paused === 'boolean' && typeof current.paused === 'boolean' && previous.paused !== current.paused) events.push({ at, label: current.paused ? 'Paused' : 'Resumed' })
  for (const [key, present] of Object.entries(current.filament)) {
    if (typeof previous.filament[key] === 'boolean' && previous.filament[key] !== present) events.push({ at, label: `${key}: filament ${present ? 'detected' : 'absent'}` })
  }
  return events
}
