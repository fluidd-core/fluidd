import { LayoutConfig } from '@/store/layout/types'

export interface DiagnosticsCardContainer {
  [key: string]: DiagnosticsCardConfig[]
}

export interface DiagnosticsCardConfig extends LayoutConfig {
  icon: string
  title: string
  height: number

  metrics: Metric[]
}

export interface Metric {
  key: string
  name: string
  suffix: string
  color: string
  factor?: number
}
