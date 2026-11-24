// Import ECharts, loaded asynchronously from main.ts
import { SurfaceChart } from 'echarts-gl/charts'
import { Grid3DComponent } from 'echarts-gl/components'
import { LineChart } from 'echarts/charts'
import {
  DatasetComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent,
  VisualMapComponent,
  GraphicComponent
} from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import ECharts from 'vue-echarts'

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
  CanvasRenderer
])

export default ECharts
