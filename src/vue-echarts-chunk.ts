// Import ECharts, loaded asynchronously from main.ts
import ECharts from 'vue-echarts'
import { use, type ComposeOption } from 'echarts/core'
import { LineChart, type LineSeriesOption } from 'echarts/charts'
import { Grid3DComponent } from 'echarts-gl/components'
import { SurfaceChart } from 'echarts-gl/charts'
import {
  DatasetComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent,
  VisualMapComponent,
  GraphicComponent,
  type DatasetComponentOption,
  type TooltipComponentOption,
  type GridComponentOption,
  type DataZoomComponentOption,
  type LegendComponentOption,
  type VisualMapComponentOption,
  type GraphicComponentOption,
  type TimelineComponentOption
} from 'echarts/components'
import { SVGRenderer, CanvasRenderer } from 'echarts/renderers'

// Configure echarts
use([
  DatasetComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent,
  LineChart,
  VisualMapComponent,
  GraphicComponent,
  SurfaceChart,
  Grid3DComponent,
  SVGRenderer,
  CanvasRenderer
])

declare module 'echarts' {
  interface EChartsOption extends ComposeOption<
    LineSeriesOption |
    DatasetComponentOption |
    TooltipComponentOption |
    GridComponentOption |
    DataZoomComponentOption |
    LegendComponentOption |
    VisualMapComponentOption |
    GraphicComponentOption |
    TimelineComponentOption
  > {
  }
}

export default ECharts
