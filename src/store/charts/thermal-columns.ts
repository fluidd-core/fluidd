// Columns are `<sensor>` or `<sensor>#<sub>`; sensor names are runtime data.
export const thermalSubKeys = ['target', 'power', 'speed'] as const

export type ThermalSubKey = typeof thermalSubKeys[number]

export type ThermalColumn = string

export interface ParsedThermalColumn {
  sensor: string;
  sub?: ThermalSubKey;
}

const thermalSubKeySet: ReadonlySet<string> = new Set(thermalSubKeys)

export const thermalColumn = (sensor: string, sub?: ThermalSubKey): ThermalColumn =>
  sub ? `${sensor}#${sub}` : sensor

export const parseThermalColumn = (column: ThermalColumn): ParsedThermalColumn => {
  const index = column.lastIndexOf('#')

  if (index === -1) return { sensor: column }

  const sub = column.slice(index + 1)

  if (!thermalSubKeySet.has(sub)) return { sensor: column }

  return { sensor: column.slice(0, index), sub: sub as ThermalSubKey }
}

// Duty cycles - secondary (%) axis, hidden by default.
export const isDutyCycleSubKey = (sub?: ThermalSubKey): boolean =>
  sub === 'power' || sub === 'speed'
