import type { LayoutConfig } from '@/store/layout/types'

export interface DiagnosticsState {
  watchValues: Record<string, unknown>
}

export interface DiagnosticsCardContainer {
  [key: string]: DiagnosticsCardConfig[]
}

interface DiagnosticsCardBase extends LayoutConfig {
  icon: string
  title: string
}

export interface DiagnosticsChartConfig extends DiagnosticsCardBase {
  type: 'chart'
  height: number
  axes: ChartAxis[]
}

export interface DiagnosticsWatchesConfig extends DiagnosticsCardBase {
  type: 'watches'
  metrics: WatchMetric[]
}

export type DiagnosticsCardConfig = DiagnosticsChartConfig | DiagnosticsWatchesConfig

export interface WatchMetric {
  name: string
  collector: string
}

export interface ChartAxis {
  enabled: boolean
  unit: string
  min?: number
  max?: number
  showLegend: boolean

  metrics: ChartMetric[]
}

export interface ChartMetric {
  collector: string
  name: string
  style: ChartMetricStyle
}

export interface ChartMetricStyle {
  lineColor: string
  lineStyle: 'solid' | 'dashed' | 'dotted'
  fillColor: string | null
  fillOpacity: number
  displayLegend: boolean
}
