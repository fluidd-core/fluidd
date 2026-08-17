import type { DefaultLabelFormatterCallbackParams } from 'echarts'

// With a keyed-columns source, `param.value` is positional, not a row object.
export type ChartTooltipParam = Pick<DefaultLabelFormatterCallbackParams, 'value' | 'encode' | 'dimensionNames'>

const valueAt = (param: ChartTooltipParam, index: number): number | undefined => {
  if (index < 0 || !Array.isArray(param.value)) return undefined

  const value = param.value[index]

  return (typeof value === 'number' && !Number.isNaN(value))
    ? value
    : undefined
}

const encodedIndex = (param: ChartTooltipParam, axis: 'x' | 'y'): number =>
  param.encode?.[axis]?.[0] ?? -1

export const tooltipDimensionName = (param: ChartTooltipParam, axis: 'x' | 'y'): string | undefined =>
  param.dimensionNames?.[encodedIndex(param, axis)]

export const tooltipValue = (param: ChartTooltipParam, axis: 'x' | 'y'): number | undefined =>
  valueAt(param, encodedIndex(param, axis))

export const tooltipValueByDimension = (param: ChartTooltipParam, dimension: string): number | undefined =>
  valueAt(param, param.dimensionNames?.indexOf(dimension) ?? -1)
