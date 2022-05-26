<template>
  <div
    :class="{container: true, dark: themeIsDark}"
    @focus="focused = true"
    @blur="focused = false"
  >
    <svg
      ref="svg"
      :viewBox="svgViewBox"
      :height="height"
      :width="width"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <pattern
          id="backgroundPattern"
          patternUnits="userSpaceOnUse"
          width="10"
          height="10"
        >
          <rect
            width="10"
            height="10"
            stroke-width=".1"
            :stroke="themeIsDark ? 'black' : 'white'"
            :fill="themeIsDark ? '#555' : 'lightgrey'"
          />
        </pattern>
        <svg
          id="retraction"
          :width="retractionIconSize"
          :height="retractionIconSize"
          viewBox="0 0 10 10"
        >
          <path
            v-if="flipY"
            d="M 0,0 L 5,10 L 10,0 Z"
            fill="red"
            fill-opacity="0.9"
            :shape-rendering="shapeRendering"
          />
          <path
            v-else
            d="M 10,10 L 5,0 L 0,10 Z"
            fill="red"
            fill-opacity="0.9"
            :shape-rendering="shapeRendering"
          />
        </svg>
        <svg
          id="extrusionStart"
          :width="retractionIconSize"
          :height="retractionIconSize"
          viewBox="0 0 10 10"
        >
          <path
            v-if="flipY"
            d="M 10,10 L 5,0 L 0,10 Z"
            fill="green"
            fill-opacity="0.9"
            :shape-rendering="shapeRendering"
          />
          <path
            v-else
            d="M 0,0 L 5,10 L 10,0 Z"
            fill="green"
            fill-opacity="0.9"
            :shape-rendering="shapeRendering"
          />
        </svg>
      </defs>
      <g :transform="flipTransform">
        <clipPath id="clipCircle">
          <circle
            :r="bedSize.x.max"
            cx="0"
            cy="0"
          />
        </clipPath>
        <g
          v-if="drawBackground"
          id="background"
        >
          <rect
            v-if="isDelta"
            :height="bedSize.y.max - bedSize.y.min"
            :width="bedSize.x.max - bedSize.x.min"
            fill="url(#backgroundPattern)"
            clip-path="url(#clipCircle)"
            :x="bedSize.x.min"
            :y="bedSize.y.min"
          />
          <rect
            v-else
            :height="bedSize.y.max - bedSize.y.min"
            :width="bedSize.x.max - bedSize.x.min"
            fill="url(#backgroundPattern)"
            :x="bedSize.x.min"
            :y="bedSize.y.min"
          />
        </g>
        <g
          v-if="getViewerOption('showPreviousLayer')"
          id="previousLayer"
          class="layer"
        >
          <path
            stroke="lightgrey"
            :stroke-width="extrusionLineWidth"
            stroke-opacity="0.6"
            :d="svgPathPrevious.extrusions"
            :shape-rendering="shapeRendering"
          />
        </g>
        <g
          v-if="getViewerOption('showCurrentLayer')"
          id="activeLayer"
          class="layer"
        >
          <path
            stroke="lightgrey"
            :stroke-width="extrusionLineWidth"
            stroke-opacity="0.6"
            :d="svgPathActive.extrusions"
            :shape-rendering="shapeRendering"
          />
        </g>
        <g
          id="currentLayer"
          class="layer"
        >
          <path
            v-if="getViewerOption('showExtrusions')"
            :d="svgPathCurrent.extrusions"
            :stroke="themeIsDark ? 'white' : 'black'"
            :stroke-width="extrusionLineWidth"
            :shape-rendering="shapeRendering"
          />
          <path
            v-if="getViewerOption('showMoves')"
            :d="svgPathCurrent.moves"
            stroke="gray"
            :stroke-width="moveLineWidth"
            :shape-rendering="shapeRendering"
          />

          <circle
            id="toolhead"
            fill="green"
            r=".6"
            :cx="svgPathCurrent.toolhead.x"
            :cy="svgPathCurrent.toolhead.y"
          />

          <g
            v-if="getViewerOption('showRetractions') && svgPathCurrent.retractions.length > 0"
            id="retractions"
          >
            <use
              v-for="({x, y}, index) of svgPathCurrent.retractions"
              :key="`retraction-${index + 1}`"
              xlink:href="#retraction"
              :x="x - (retractionIconSize / 2)"
              :y="flipY ? y : y - retractionIconSize"
            />
            <!-- Calculate anchor to be bottom-center of the triangle -->
          </g>

          <g
            v-if="getViewerOption('showRetractions') && svgPathCurrent.retractions.length > 0"
            id="extrusionStarts"
          >
            <use
              v-for="({x, y}, index) of svgPathCurrent.extrusionStarts"
              :key="`extrusion-start-${index + 1}`"
              xlink:href="#extrusionStart"
              :x="x - (retractionIconSize / 2)"
              :y="flipY ? y : y - retractionIconSize"
            />
            <!-- Calculate anchor to be bottom-center of the triangle -->
          </g>
        </g>
        <g
          v-if="getViewerOption('showNextLayer')"
          id="nextLayer"
          class="layer"
        >
          <path
            stroke="lightgrey"
            stroke-opacity="0.6"
            :d="svgPathNext.extrusions"
            :stroke-width="extrusionLineWidth"
          />
        </g>
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import panzoom, { PanZoom } from 'panzoom'
import { BBox, LayerNr, LayerPaths } from '@/store/gcodePreview/types'
import { GcodePreviewConfig } from '@/store/config/types'

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

  focused = false

  panzoom?: PanZoom

  panning = false

  get isDelta (): boolean {
    const kinematics = this.$store.getters['printer/getPrinterSettings']('printer.kinematics')
    return kinematics === 'delta' || kinematics === 'rotary_delta'
  }

  get printerRadius (): number {
    return this.$store.getters['printer/getPrinterSettings']('printer.print_radius') ?? 100.0
  }

  get themeIsDark (): boolean {
    return this.$store.state.config.uiSettings.theme.isDark
  }

  get filePosition (): number {
    return this.$store.state.printer.printer.virtual_sdcard.file_position
  }

  get isMobile (): boolean {
    return this.$vuetify.breakpoint.mobile
  }

  get extrusionLineWidth () {
    return this.getUiSetting('extrusionLineWidth')
  }

  get moveLineWidth () {
    return this.getUiSetting('moveLineWidth')
  }

  get retractionIconSize () {
    return this.getUiSetting('retractionIconSize')
  }

  get drawBackground () {
    return this.getUiSetting('drawBackground')
  }

  get showAnimations () {
    return this.getUiSetting('showAnimations')
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

    if (this.isDelta) {
      return `scale(${scale.join()}) translate(0,0)`
    }

    const transform = [
      this.flipX ? -(x.max - x.min) : 0,
      this.flipY ? -(y.max - y.min) : 0
    ]

    return `scale(${scale.join()}) translate(${transform.join()})`
  }

  get bedSize (): BBox {
    const {
      stepper_x: stepperX,
      stepper_y: stepperY
    } = this.$store.getters['printer/getPrinterSettings']()

    if (this.isDelta) {
      const radius = this.printerRadius
      return {
        x: {
          min: -radius,
          max: radius
        },
        y: {
          min: -radius,
          max: radius
        }
      }
    }

    return {
      x: {
        min: stepperX?.position_min ?? 0,
        max: stepperX?.position_max ?? 100
      },
      y: {
        min: stepperY?.position_min ?? 0,
        max: stepperY?.position_max ?? 100
      }
    }
  }

  get viewBox (): BBox {
    const bounds = this.$store.getters['gcodePreview/getBounds']

    const {
      stepper_x: stepperX,
      stepper_y: stepperY
    } = this.$store.getters['printer/getPrinterSettings']()

    if (this.isDelta) {
      const radius = this.printerRadius
      return {
        x: {
          min: -radius,
          max: radius * 2
        },
        y: {
          min: -radius,
          max: radius * 2
        }
      }
    }

    if (stepperX === undefined || stepperY === undefined) {
      return {
        x: {
          min: bounds.x.min,
          max: bounds.x.max
        },
        y: {
          min: bounds.y.min,
          max: bounds.y.max
        }
      }
    }

    return {
      x: {
        min: Math.min(stepperX.position_min, bounds.x.min),
        max: Math.max(stepperX.position_max, bounds.x.max)
      },
      y: {
        min: Math.min(stepperY.position_min, bounds.y.min),
        max: Math.max(stepperY.position_max, bounds.y.max)
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

  get svgPathActive (): LayerPaths {
    if (this.disabled) {
      return this.defaultLayerPaths
    }

    return this.$store.getters['gcodePreview/getLayerPaths'](this.layer)
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

  @Watch('isMobile')
  onIsMobileChanged () {
    if (this.panzoom) {
      if (this.isMobile) {
        this.panzoom.pause()
      } else {
        this.panzoom.resume()
      }
    }
  }

  @Watch('focused')
  onFocusedChanged () {
    if (this.isMobile && this.panzoom) {
      if (this.focused) {
        this.panzoom.resume()
      } else {
        this.panzoom.pause()
      }
    }
  }

  mounted () {
    this.panzoom = panzoom(this.$refs.svg as SVGElement, {
      maxZoom: 20,
      minZoom: 0.95,
      bounds: true,
      boundsPadding: 0.6,
      smoothScroll: this.showAnimations,

      beforeWheel: () => !this.focused
    })

    this.panzoom.on('panstart', () => {
      this.panning = true
    })

    this.panzoom.on('panend', () => {
      this.panning = false
    })
  }

  beforeDestroy () {
    this.panzoom?.dispose()
  }

  reset () {
    this.panzoom?.zoomTo(0, 0, 1)
  }

  getViewerOption (name: string) {
    return this.$store.getters['gcodePreview/getViewerOption'](name)
  }

  getUiSetting (name: keyof GcodePreviewConfig) {
    return this.$store.state.config.uiSettings.gcodePreview[name]
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
  max-height: 50vh;
  aspect-ratio: 1;

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
