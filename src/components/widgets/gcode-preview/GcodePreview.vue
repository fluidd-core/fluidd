<template>
  <div :class="{container: true, dark: themeIsDark}">
    <svg :viewBox="svgViewBox" :height="height" :width="width" ref="svg"
         xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <pattern id="backgroundPattern" patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" stroke-width=".1"
                :stroke="themeIsDark ? 'black' : 'white'"
                :fill="themeIsDark ? '#555' : 'lightgrey'"/>
        </pattern>
        <svg id="retraction" :width="retractionIconSize" :height="retractionIconSize" viewBox="0 0 10 10">
          <path v-if="flipY" d="M 0,0 L 5,10 L 10,0 Z" fill="red" fill-opacity="0.9" :shape-rendering="shapeRendering"/>
          <path v-else d="M 10,10 L 5,0 L 0,10 Z" fill="red" fill-opacity="0.9" :shape-rendering="shapeRendering"/>
        </svg>
        <svg id="extrusionStart" :width="retractionIconSize" :height="retractionIconSize" viewBox="0 0 10 10">
          <path v-if="flipY" d="M 10,10 L 5,0 L 0,10 Z" fill="green" fill-opacity="0.9" :shape-rendering="shapeRendering"/>
          <path v-else d="M 0,0 L 5,10 L 10,0 Z" fill="green" fill-opacity="0.9" :shape-rendering="shapeRendering"/>
        </svg>
      </defs>
      <g :transform="flipTransform">
        <g id="background" v-if="drawBackground">
          <rect :height="bedSize.y.max - bedSize.y.min"
                :width="bedSize.x.max - bedSize.x.min"
                style="fill: url(#backgroundPattern);"
                :x="bedSize.x.min" :y="bedSize.y.min"/>
        </g>
        <g id="previousLayer" class="layer" v-if="getViewerOption('showPreviousLayer')">
          <path stroke="lightgrey" :stroke-width="extrusionLineWidth" stroke-opacity="0.6"
                :d="svgPathPrevious.extrusions" :shape-rendering="shapeRendering"/>
        </g>
        <g id="currentLayer" class="layer">
          <path :d="svgPathCurrent.extrusions" v-if="getViewerOption('showExtrusions')"
                :stroke="themeIsDark ? 'white' : 'black'"
                :stroke-width="extrusionLineWidth"
                :shape-rendering="shapeRendering"/>
          <path :d="svgPathCurrent.moves" v-if="getViewerOption('showMoves')"
                stroke="gray"
                :stroke-width="moveLineWidth"
                :shape-rendering="shapeRendering"/>

          <circle id="toolhead" fill="green" r=".6"
                  :cx="svgPathCurrent.toolhead.x" :cy="svgPathCurrent.toolhead.y"/>

          <g id="retractions" v-if="getViewerOption('showRetractions') && svgPathCurrent.retractions.length > 0">
            <use v-for="({x, y}, index) of svgPathCurrent.retractions"
                 :key="`retraction-${index + 1}`" xlink:href="#retraction"
                 :x="x - (retractionIconSize / 2)" :y="flipY ? y : y - retractionIconSize"/>
            <!-- Calculate anchor to be bottom-center of the triangle -->
          </g>

          <g id="extrusionStarts" v-if="getViewerOption('showRetractions') && svgPathCurrent.retractions.length > 0">
            <use v-for="({x, y}, index) of svgPathCurrent.extrusionStarts"
                 :key="`extrusion-start-${index + 1}`" xlink:href="#extrusionStart"
                 :x="x - (retractionIconSize / 2)" :y="flipY ? y : y - retractionIconSize"/>
            <!-- Calculate anchor to be bottom-center of the triangle -->
          </g>
        </g>
        <g id="nextLayer" class="layer" v-if="getViewerOption('showNextLayer')">
          <path stroke="lightgrey" stroke-opacity="0.6"
                :d="svgPathNext.extrusions"
                :stroke-width="extrusionLineWidth"/>
        </g>
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import panzoom, { PanZoom } from 'panzoom'
import { LayerNr, LayerPaths } from '@/store/gcodePreview/types'

@Component({})
export default class GcodePreview extends Mixins(StateMixin) {
  @Prop({
    type: Boolean,
    default: true
  })
  disabled!: boolean

  @Prop({
    type: String
  })
  width!: string

  @Prop({
    type: String
  })
  height!: string

  @Prop({
    type: Number,
    default: Infinity
  })
  progress!: number

  @Prop({
    type: Number,
    default: 0
  })
  layer!: LayerNr

  panzoom?: PanZoom

  panning = false

  get themeIsDark (): boolean {
    return this.$store.state.config.uiSettings.theme.isDark
  }

  get filePosition (): number {
    return this.$store.state.printer.printer.virtual_sdcard.file_position
  }

  get extrusionLineWidth () {
    return this.$store.state.config.uiSettings.gcodePreview.extrusionLineWidth
  }

  get moveLineWidth () {
    return this.$store.state.config.uiSettings.gcodePreview.moveLineWidth
  }

  get retractionIconSize () {
    return this.$store.state.config.uiSettings.gcodePreview.retractionIconSize
  }

  get drawBackground () {
    return this.$store.state.config.uiSettings.gcodePreview.drawBackground
  }

  get shapeRendering () {
    return this.panning ? 'optimizeSpeed' : 'geometricPrecision'
  }

  get flipX (): boolean {
    return this.$store.state.config.uiSettings.gcodePreview.flip.horizontal
  }

  get flipY (): boolean {
    return this.$store.state.config.uiSettings.gcodePreview.flip.vertical
  }

  get flipTransform () {
    const {
      x,
      y
    } = this.viewBox

    const scale = [
      this.flipX ? -1 : 1,
      this.flipY ? -1 : 1
    ]

    const transform = [
      this.flipX ? -(x.max - x.min) : 0,
      this.flipY ? -(y.max - y.min) : 0
    ]

    return `scale(${scale.join()}) translate(${transform.join()})`
  }

  get bedSize () {
    const {
      stepper_x: stepperX,
      stepper_y: stepperY
    } = this.$store.getters['printer/getPrinterSettings']()

    if (stepperX === undefined || stepperY === undefined) {
      return {
        x: {
          min: 0,
          max: 100
        },
        y: {
          min: 0,
          max: 100
        }
      }
    }

    return {
      x: {
        min: stepperX.position_min,
        max: stepperX.position_max
      },
      y: {
        min: stepperY.position_min,
        max: stepperY.position_max
      }
    }
  }

  get viewBox () {
    const bounds = this.$store.getters['gcodePreview/getBounds']

    const {
      stepper_x: stepperX,
      stepper_y: stepperY
    } = this.$store.getters['printer/getPrinterSettings']()

    if (stepperX === undefined || stepperY === undefined) {
      return {
        x: {
          min: bounds.xMin,
          max: bounds.xMax
        },
        y: {
          min: bounds.yMin,
          max: bounds.yMax
        }
      }
    }

    return {
      x: {
        min: Math.min(stepperX.position_min, bounds.xMin),
        max: Math.max(stepperX.position_max, bounds.xMax)
      },
      y: {
        min: Math.min(stepperY.position_min, bounds.yMin),
        max: Math.max(stepperY.position_max, bounds.yMax)
      }
    }
  }

  get svgViewBox () {
    const {
      x,
      y
    } = this.viewBox

    return `${x.min} ${y.min} ${x.max} ${y.max}`
  }

  get defaultLayerPaths (): LayerPaths {
    return {
      extrusions: '',
      moves: '',
      retractions: [],
      extrusionStarts: [],
      toolhead: {
        x: 0,
        y: 0
      }
    }
  }

  get svgPathCurrent (): LayerPaths {
    if (this.disabled) {
      return this.defaultLayerPaths
    }

    const layer = this.$store.getters['gcodePreview/getLayers'][this.layer]

    if (this.getViewerOption('followProgress')) {
      const end = this.$store.getters['gcodePreview/getMoveIndexByFilePosition'](this.filePosition)

      return this.$store.getters['gcodePreview/getPaths'](layer?.move ?? 0, end)
    }

    return this.$store.getters['gcodePreview/getPaths'](layer?.move ?? 0, this.progress)
  }

  get svgPathPrevious (): LayerPaths {
    if (this.disabled || this.layer <= 0) {
      return this.defaultLayerPaths
    }

    return this.$store.getters['gcodePreview/getLayerPaths'](this.layer - 1)
  }

  get svgPathNext (): LayerPaths {
    const layers = this.$store.getters['gcodePreview/getLayers']

    if (this.disabled || this.layer >= layers.length) {
      return this.defaultLayerPaths
    }

    return this.$store.getters['gcodePreview/getLayerPaths'](this.layer + 1)
  }

  mounted () {
    this.panzoom = panzoom(this.$refs.svg as SVGElement, {
      maxZoom: 20,
      minZoom: 0.98,
      bounds: true,
      boundsPadding: 0.8
    })

    this.panzoom.on('panstart', () => {
      this.panning = true
    })

    this.panzoom.on('panend', () => {
      this.panning = false
    })
  }

  beforeDestroy () {
    // eslint-disable-next-line no-unused-expressions
    this.panzoom?.dispose()
  }

  reset () {
    // eslint-disable-next-line no-unused-expressions
    this.panzoom?.zoomTo(0, 0, 1)
  }

  getViewerOption (name: string) {
    return this.$store.getters['gcodePreview/getViewerOption'](name)
  }
}
</script>

<style lang="scss" scoped>
.layer > path {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.container {
  outline: none;
  overflow: hidden;
  border: 1px solid black;

  &:focus {
    border-color: grey;
    box-shadow: 0 0 4px 0 black;
  }

  .dark {
    &:focus {
      box-shadow: 0 0 4px 0 lightgrey;
    }
  }
}

svg {
  shape-rendering: geometricPrecision;
}
</style>
