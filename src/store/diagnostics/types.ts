import { LayoutConfig } from '@/store/layout/types'

export interface DiagnosticsCardContainer {
  [key: string]: DiagnosticsCardConfig[]
}

export interface DiagnosticsCardConfig extends LayoutConfig {
  icon: string
  title: string
  height: number

  axis: ChartAxis[]
}

export interface ChartAxis {
  unit: string
  min?: number
  max?: number
  showLegend: boolean

  metrics: Metric[]
}

export interface Metric {
  collector: string
  name: string
  style: MetricStyle
}

export interface MetricStyle {
  lineColor: string
  lineStyle: 'solid' | 'dashed' | 'dotted'
  fillColor?: string
  fillOpacity: number
  displayLegend: boolean
}
