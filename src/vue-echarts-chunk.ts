// Import ECharts, loaded asynchronously from main.ts
import ECharts from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { Grid3DComponent } from 'echarts-gl/components'
import { SurfaceChart } from 'echarts-gl/charts'
import {
  DatasetComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
  LegendComponent,
  VisualMapComponent,
  GraphicComponent
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

export default ECharts
