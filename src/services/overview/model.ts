import { colourName } from '@/services/control/model'

/** A heater's tile: its temperature, its target, and in words how close it is. */
export interface HeaterTile {
  temperature: number;
  target: number;
  status: 'off' | 'heating' | 'cooling' | 'at temperature';
  /** 0 to 1, how far it has come from cold to its target, for the bar under it. */
  progress: number;
}

/** Within this of its target, a heater is at temperature. */
const AT_TEMPERATURE = 2

export function heaterTile (temperature: number, target: number, ambient = 22): HeaterTile {
  if (!target) return { temperature, target: 0, status: 'off', progress: 0 }
  const progress = Math.min(1, Math.max(0, (temperature - ambient) / Math.max(1, target - ambient)))
  if (Math.abs(temperature - target) <= AT_TEMPERATURE) return { temperature, target, status: 'at temperature', progress: 1 }
  return { temperature, target, status: temperature < target ? 'heating' : 'cooling', progress }
}

/** Grams if the slicer said how heavy, else metres: "3.1 of 7.5 g", "1.04 of 2.51 m". */
export function filamentFact (usedMm: number, totalMm: number | null, totalGrams: number | null): string | null {
  if (!usedMm && !totalMm) return null
  if (totalMm && totalGrams) {
    const used = usedMm / totalMm * totalGrams
    return `${used.toFixed(1)} of ${totalGrams.toFixed(1)} g`
  }
  const m = (mm: number) => (mm / 1000).toFixed(2)
  return totalMm ? `${m(usedMm)} of ${m(totalMm)} m` : `${m(usedMm)} m`
}

/**
 * The spool on the printer, in words: "PETG · Blue" as someone said, else
 * "PLA · from the file" from the file being printed, else "Not set".
 */
export function spoolFact (loaded: string | null, loadedColour: string | null, fromFile: { name: string, colour: string | null } | null): string {
  if (loaded) return [loaded, loadedColour ? colourName(loadedColour) : ''].filter(Boolean).join(' · ')
  if (fromFile) return [fromFile.name, fromFile.colour ? colourName(fromFile.colour) : '', 'from the file'].filter(Boolean).join(' · ')
  return 'Not set'
}

/** "10 min", "1 h 5 min": how long, for people. */
export function longDuration (seconds: number): string {
  const minutes = Math.max(0, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export interface ChartLine {
  key: string;
  /** The SVG path of its readings. */
  path: string;
  /** Its target, a flat dashed line, when it has one. */
  targetY: number | null;
}

export interface ChartPoint {
  [key: string]: number | Date;
  date: Date;
}

/**
 * The temperature graph's lines for the last `windowSeconds`, drawn in a
 * box `width` by `height`. The scale fits every reading and target shown,
 * with a little room above and below.
 */
export function chartLines (data: ChartPoint[], keys: string[], windowSeconds: number, now: number, width = 600, height = 160): { lines: ChartLine[], min: number, max: number } {
  const from = now - windowSeconds * 1000
  const shown = data.filter(d => d.date.getTime() >= from)
  const values: number[] = []
  for (const d of shown) {
    for (const key of keys) {
      const v = d[key]
      if (typeof v === 'number') values.push(v)
      const t = d[`${key}Target`]
      if (typeof t === 'number' && t > 0) values.push(t)
    }
  }
  if (!values.length) return { lines: [], min: 0, max: 0 }
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const pad = Math.max(5, (hi - lo) * 0.1)
  const min = Math.floor(lo - pad)
  const max = Math.ceil(hi + pad)
  const x = (date: Date) => ((date.getTime() - from) / (windowSeconds * 1000)) * width
  const y = (v: number) => height - ((v - min) / (max - min)) * height
  const lines = keys.map(key => {
    const points = shown.filter(d => typeof d[key] === 'number')
    const path = points.map((d, i) => `${i ? 'L' : 'M'}${x(d.date).toFixed(1)} ${y(d[key] as number).toFixed(1)}`).join(' ')
    const last = points[points.length - 1]
    const target = last ? last[`${key}Target`] : undefined
    return { key, path, targetY: typeof target === 'number' && target > 0 ? y(target) : null }
  }).filter(l => l.path)
  return { lines, min, max }
}

/**
 * The graph's windows, as many as Moonraker keeps: temperature_store_size
 * is a sample a second, so a window longer than it would be mostly blank.
 * 5 min, 15 min and 1 h where they fit, and the whole store when it falls
 * between them (10 min on the usual 600).
 */
export function chartWindows (retentionSeconds: number): Array<{ value: number, label: string }> {
  const keep = Math.max(60, Math.floor(retentionSeconds))
  const values = [300, 900, 3600].filter(v => v <= keep)
  if (!values.includes(keep) && keep < 3600 && (values.length === 0 || keep > values[values.length - 1])) values.push(keep)
  return values.map(v => ({ value: v, label: v >= 3600 ? `${v / 3600} h` : `${Math.round(v / 60)} min` }))
}

/** The window shown first: 15 min when kept, else the longest there is. */
export function defaultChartWindow (windows: Array<{ value: number }>): number {
  return windows.some(w => w.value === 900) ? 900 : windows[windows.length - 1]?.value ?? 300
}

export interface SensorRow<H> {
  key: string;
  label: string;
  /** Heater power, 0 to 100, or null for a sensor. */
  power: number | null;
  actual: string;
  /** The heater, whose target can be set; null for a sensor. */
  heater: H | null;
}

/**
 * The table of every heater and sensor: the nozzle and bed by their
 * everyday names, power as a percentage, and temperatures to a tenth.
 */
export function sensorRows<H extends { name: string, prettyName: string, temperature: number, power?: number }> (
  heaters: H[],
  sensors: Array<{ key: string, prettyName: string, temperature?: number }>
): Array<SensorRow<H>> {
  const label = (name: string, pretty: string) => name === 'extruder' ? 'Nozzle' : name === 'heater_bed' ? 'Bed' : pretty
  const deg = (t: number | undefined) => typeof t === 'number' && Number.isFinite(t) ? `${t.toFixed(1)}°` : '—'
  return [
    ...heaters.map(h => ({ key: h.name, label: label(h.name, h.prettyName), power: Math.round((h.power ?? 0) * 100), actual: deg(h.temperature), heater: h })),
    ...sensors.map(s => ({ key: s.key, label: s.prettyName, power: null, actual: deg(s.temperature), heater: null }))
  ]
}
