<template>
  <app-focusable-container
    ref="container"
    :disabled="disabled"
    @focus="focused = true"
    @blur="focused = false"
  >
    <svg
      ref="svg"
      :viewBox="svgViewBox"
      height="100%"
      width="100%"
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
            :fill-opacity="disabled ? 0.6 : undefined"
          />
        </pattern>
        <clipPath
          v-if="hasRoundBed"
          id="clipCircle"
        >
          <circle
            :r="bedSize.maxX"
            cx="0"
            cy="0"
          />
        </clipPath>
        <svg
          id="retraction"
          :width="retractionIconSize"
          :height="retractionIconSize"
          viewBox="0 0 10 10"
        >
          <path
            v-if="flipY"
            d="m0 0 5 10 5-10Z"
            fill="red"
            fill-opacity="0.9"
            :shape-rendering="shapeRendering"
          />
          <path
            v-else
            d="M10 10 5 0 0 10Z"
            fill="red"
            fill-opacity="0.9"
            :shape-rendering="shapeRendering"
          />
        </svg>
        <svg
          id="unretraction"
          :width="retractionIconSize"
          :height="retractionIconSize"
          viewBox="0 0 10 10"
        >
          <path
            v-if="flipY"
            d="M10 10 5 0 0 10Z"
            fill="green"
            fill-opacity="0.9"
            :shape-rendering="shapeRendering"
          />
          <path
            v-else
            d="m0 0 5 10 5-10Z"
            fill="green"
            fill-opacity="0.9"
            :shape-rendering="shapeRendering"
          />
        </svg>
        <svg
          id="origin"
          width="12"
          height="12"
          viewBox="-2 -2 12 12"
        >
          <path
            fill="#ff0000"
            fill-opacity="0.4"
            d="m8.586-1.414-.354.353.811.811H.969A1 1 0 0 1 1 0a1 1 0 0 1-.033.25h8.076l-.81.81.353.354L10 0z"
            :shape-rendering="shapeRendering"
          />
          <path
            fill="#00ff00"
            fill-opacity="0.4"
            d="M-.25.967v8.076l-.81-.81-.354.353L0 10l1.414-1.414-.353-.354-.811.811V.967A1 1 0 0 1 0 1 1 1 0 0 1-.25.967"
            :shape-rendering="shapeRendering"
          />
          <circle
            fill="#0000ff"
            fill-opacity="0.4"
            cx="0"
            cy="0"
            r="1"
            :shape-rendering="shapeRendering"
          />
        </svg>
      </defs>
      <g :transform="flipTransform">
        <g
          v-if="drawBackground"
          id="background"
        >
          <rect
            :height="bedSize.maxY - bedSize.minY"
            :width="bedSize.maxX - bedSize.minX"
            fill="url(#backgroundPattern)"
            :clip-path="hasRoundBed ? 'url(#clipCircle)' : undefined"
            :x="bedSize.minX"
            :y="bedSize.minY"
          />
        </g>
        <g v-if="drawOrigin">
          <use
            xlink:href="#origin"
            x="-2"
            y="-2"
          />
        </g>
        <g
          v-if="showParts && !showExcludeObjects && svgPathParts.length > 0"
          id="parts"
        >
          <path
            v-for="(part, index) of svgPathParts"
            :key="`part-${index + 1}`"
            fill-opacity="0.2"
            :d="part"
            :shape-rendering="shapeRendering"
          />
        </g>
        <g
          v-if="showPreviousLayer"
          id="previousLayer"
          class="layer"
        >
          <path
            v-for="(extrusion, tool) in svgPathPrevious.extrusions"
            :key="tool"
            :stroke="themeIsDark ? 'lightgrey' : '#555'"
            :stroke-width="extrusionLineWidth"
            stroke-opacity="0.6"
            :d="extrusion"
            :shape-rendering="shapeRendering"
          />
        </g>
        <g
          v-if="showCurrentLayer"
          id="activeLayer"
          class="layer"
        >
          <path
            v-for="(extrusion, tool) in svgPathActive.extrusions"
            :key="tool"
            :stroke="themeIsDark ? 'lightgrey' : '#555'"
            :stroke-width="extrusionLineWidth"
            stroke-opacity="0.6"
            :d="extrusion"
            :shape-rendering="shapeRendering"
          />
        </g>
        <g
          id="currentLayer"
          class="layer"
        >
          <template v-if="showExtrusions">
            <path
              v-for="(extrusion, tool) in svgPathCurrent.extrusions"
              :key="tool"
              :d="extrusion"
              :stroke="toolColors[tool]"
              :stroke-width="extrusionLineWidth"
              :shape-rendering="shapeRendering"
            />
          </template>
          <path
            v-if="showMoves"
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
            v-if="showRetractions && svgPathCurrent.retractions.length > 0"
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
            v-if="showRetractions && svgPathCurrent.unretractions.length > 0"
            id="unretractions"
          >
            <use
              v-for="({x, y}, index) of svgPathCurrent.unretractions"
              :key="`unretraction-${index + 1}`"
              xlink:href="#unretraction"
              :x="x - (retractionIconSize / 2)"
              :y="flipY ? y : y - retractionIconSize"
            />
            <!-- Calculate anchor to be bottom-center of the triangle -->
          </g>
        </g>
        <g
          v-if="showNextLayer"
          id="nextLayer"
          class="layer"
        >
          <path
            v-for="(extrusion, key) in svgPathNext.extrusions"
            :key="key"
            stroke="lightgrey"
            stroke-opacity="0.6"
            :d="extrusion"
            :stroke-width="extrusionLineWidth"
            :shape-rendering="shapeRendering"
          />
        </g>
        <exclude-objects
          v-if="showParts && showExcludeObjects"
          :shape-rendering="shapeRendering"
          @cancel="$emit('cancelObject', $event)"
        />
      </g>
    </svg>
    <div
      v-if="file"
      class="preview-options"
      @mousedown.stop=""
      @mouseup="keepFocus"
      @dblclick.stop=""
      @touchstart="panzoom?.pause()"
      @touchend="panzoom?.resume()"
    >
      <div>
        <gcode-preview-button
          v-model="followProgress"
          icon="$play"
          :tooltip="$t('app.gcode.label.follow_progress')"
        />

        <gcode-preview-button
          v-model="showPreviousLayer"
          icon="$previousLayer"
          :tooltip="$t('app.gcode.label.show_previous_layer')"
        />

        <gcode-preview-button
          v-model="showCurrentLayer"
          icon="$currentLayer"
          :tooltip="$t('app.gcode.label.show_current_layer')"
        />

        <gcode-preview-button
          v-model="showNextLayer"
          icon="$nextLayer"
          :tooltip="$t('app.gcode.label.show_next_layer')"
        />

        <gcode-preview-button
          v-model="showMoves"
          icon="$moves"
          :tooltip="$t('app.gcode.label.show_moves')"
        />

        <gcode-preview-button
          v-model="showExtrusions"
          icon="$extrusions"
          :tooltip="$t('app.gcode.label.show_extrusions')"
        />

        <gcode-preview-button
          v-model="showRetractions"
          icon="$retractions"
          :tooltip="$t('app.gcode.label.show_retractions')"
        />

        <gcode-preview-button
          v-model="showParts"
          icon="$parts"
          :tooltip="$t('app.gcode.label.show_parts')"
        />

        <v-btn
          icon
          small
          @click="autoZoom = !autoZoom"
        >
          <v-icon>{{ autoZoom ? '$magnifyMinus' : '$magnifyPlus' }}</v-icon>
        </v-btn>
      </div>
      <div
        v-if="tools.length > 0"
        class="mt-1"
      >
        <gcode-preview-tool
          v-for="(color, tool) in toolColors"
          :key="tool"
          :tool="tool"
          :color="color"
          :active="svgPathCurrent.tool === tool"
        />
      </div>
    </div>
    <div
      v-if="file"
      class="preview-name"
    >
      {{ file.filename }}
    </div>
  </app-focusable-container>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import panzoom, { type PanZoom } from 'panzoom'
import type { BBox, Layer, LayerPaths, Tool } from '@/store/gcodePreview/types'
import type AppFocusableContainer from '@/components/ui/AppFocusableContainer.vue'
import ExcludeObjects from '@/components/widgets/exclude-objects/ExcludeObjects.vue'
import GcodePreviewButton from './GcodePreviewButton.vue'
import GcodePreviewTool from './GcodePreviewTool.vue'
import type { AppFile, AppFileWithMeta } from '@/store/files/types'
import type { BedSize } from '@/store/printer/types'

@Component({
  components: {
    ExcludeObjects,
    GcodePreviewButton,
    GcodePreviewTool
  }
})
export default class GcodePreview extends Mixins(StateMixin, BrowserMixin) {
  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: Number, default: Number.POSITIVE_INFINITY })
  readonly progress!: number

  @Prop({ type: Number, default: 0 })
  readonly layer!: number

  @Ref('container')
  readonly container!: AppFocusableContainer

  @Ref('svg')
  readonly svg!: SVGElement

  focused = false

  panzoom?: PanZoom

  panning = false

  get themeIsDark (): boolean {
    return this.$typedState.config.uiSettings.theme.isDark
  }

  get filePosition (): number {
    return this.$typedState.printer.printer.virtual_sdcard?.file_position ?? 0
  }

  get extrusionLineWidth (): number {
    return this.$typedState.config.uiSettings.gcodePreview.extrusionLineWidth
  }

  get moveLineWidth (): number {
    return this.$typedState.config.uiSettings.gcodePreview.moveLineWidth
  }

  get retractionIconSize (): number {
    return this.$typedState.config.uiSettings.gcodePreview.retractionIconSize
  }

  get drawBackground (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.drawBackground
  }

  get drawOrigin (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.drawOrigin
  }

  get showAnimations (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.showAnimations
  }

  get autoZoom (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.autoZoom
  }

  set autoZoom (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.autoZoom',
      value,
      server: true
    })

    this.reset()
  }

  get followProgress (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.followProgress
  }

  set followProgress (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.followProgress',
      value,
      server: true
    })
  }

  get showPreviousLayer (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.showPreviousLayer
  }

  set showPreviousLayer (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.showPreviousLayer',
      value,
      server: true
    })
  }

  get showCurrentLayer (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.showCurrentLayer
  }

  set showCurrentLayer (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.showCurrentLayer',
      value,
      server: true
    })
  }

  get showNextLayer (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.showNextLayer
  }

  set showNextLayer (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.showNextLayer',
      value,
      server: true
    })
  }

  get showMoves (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.showMoves
  }

  set showMoves (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.showMoves',
      value,
      server: true
    })
  }

  get showExtrusions (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.showExtrusions
  }

  set showExtrusions (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.showExtrusions',
      value,
      server: true
    })
  }

  get showRetractions (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.showRetractions
  }

  set showRetractions (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.showRetractions',
      value,
      server: true
    })
  }

  get showParts (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.showParts
  }

  set showParts (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.showParts',
      value,
      server: true
    })
  }

  get shapeRendering () {
    return this.panning ? 'optimizeSpeed' : 'geometricPrecision'
  }

  get hasExcludeObjectParts (): boolean {
    return this.$typedGetters['printer/getHasExcludeObjectParts']
  }

  get printerFile (): AppFileWithMeta | undefined {
    return this.$typedGetters['printer/getPrinterFile']
  }

  get showExcludeObjects (): boolean {
    if (!this.klippyReady || !this.hasExcludeObjectParts) {
      return false
    }

    const file = this.file

    if (!file) {
      return true
    }

    const printerFile = this.printerFile

    return (
      printerFile != null &&
      file.path === printerFile.path &&
      file.filename === printerFile.filename
    )
  }

  get flipX (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.flip.horizontal
  }

  get flipY (): boolean {
    return this.$typedState.config.uiSettings.gcodePreview.flip.vertical
  }

  get flipTransform () {
    const { x, y } = this.viewBox

    const scale = [
      this.flipX ? -1 : 1,
      this.flipY ? -1 : 1
    ]

    const transform = [
      this.flipX ? -(x.max + x.min) : 0,
      this.flipY ? -(y.max + y.min) : 0
    ]

    return `scale(${scale.join()}) translate(${transform.join()})`
  }

  get hasRoundBed (): boolean {
    return this.$typedGetters['printer/getHasRoundBed']
  }

  get bedSize (): BedSize {
    return this.$typedGetters['printer/getBedSize']
  }

  get viewBox (): BBox {
    const bounds = this.bounds

    if (this.autoZoom) {
      const padding = Math.min(bounds.x.max - bounds.x.min, bounds.y.max - bounds.y.min) * 0.05

      return {
        x: {
          min: bounds.x.min - padding,
          max: bounds.x.max + padding
        },
        y: {
          min: bounds.y.min - padding,
          max: bounds.y.max + padding
        }
      }
    }

    const bedSize = this.bedSize

    return {
      x: {
        min: Math.min(bedSize.minX, bounds.x.min) - 2,
        max: Math.max(bedSize.maxX, bounds.x.max) + 2
      },
      y: {
        min: Math.min(bedSize.minY, bounds.y.min) - 2,
        max: Math.max(bedSize.maxY, bounds.y.max) + 2
      }
    }
  }

  get svgViewBox () {
    const { x, y } = this.viewBox

    return `${x.min} ${y.min} ${x.max - x.min} ${y.max - y.min}`
  }

  get defaultLayerPaths (): Readonly<LayerPaths> {
    return Object.freeze({
      extrusions: {},
      moves: '',
      retractions: [],
      unretractions: [],
      toolhead: {
        x: 0,
        y: 0
      },
      tool: 'T0'
    })
  }

  get svgPathCurrent (): Readonly<LayerPaths> {
    if (this.disabled) {
      return this.defaultLayerPaths
    }

    const layer: readonly Layer | undefined = this.$typedGetters['gcodePreview/getLayers'][this.layer]

    if (this.followProgress) {
      const end: number = this.$typedGetters['gcodePreview/getMoveIndexByFilePosition'](this.filePosition)

      return this.$typedGetters['gcodePreview/getPaths'](layer?.move ?? 0, end)
    }

    return this.$typedGetters['gcodePreview/getPaths'](layer?.move ?? 0, this.progress)
  }

  get svgPathActive (): Readonly<LayerPaths> {
    if (this.disabled) {
      return this.defaultLayerPaths
    }

    return this.$typedGetters['gcodePreview/getLayerPaths'](this.layer)
  }

  get svgPathPrevious (): Readonly<LayerPaths> {
    if (this.disabled || this.layer <= 0) {
      return this.defaultLayerPaths
    }

    return this.$typedGetters['gcodePreview/getLayerPaths'](this.layer - 1)
  }

  get svgPathNext (): Readonly<LayerPaths> {
    const layers: readonly Layer[] = this.$typedGetters['gcodePreview/getLayers']

    if (this.disabled || this.layer >= layers.length) {
      return this.defaultLayerPaths
    }

    return this.$typedGetters['gcodePreview/getLayerPaths'](this.layer + 1)
  }

  get svgPathParts (): readonly string[] {
    return this.$typedGetters['gcodePreview/getPartPaths']
  }

  get file (): AppFile | AppFileWithMeta | null {
    return this.$typedState.gcodePreview.file
  }

  get tools (): readonly number[] {
    return this.$typedState.gcodePreview.tools
  }

  get toolColors (): Record<Tool, string> {
    return this.$typedGetters['gcodePreview/getToolColors']
  }

  get bounds (): BBox {
    return this.$typedGetters['gcodePreview/getBounds']
  }

  @Watch('focused')
  onFocusedChanged (value: boolean) {
    if (this.panzoom && !this.isMobileViewport) {
      if (value) {
        this.panzoom.resume()
      } else {
        this.panzoom.pause()
      }
    }
  }

  mounted () {
    this.panzoom = panzoom(this.svg, {
      maxZoom: 20,
      minZoom: 0.95,
      smoothScroll: this.showAnimations,

      beforeMouseDown: () => this.disabled,
      beforeWheel: () => !this.focused || this.disabled,
      onClick: () => this.disabled,
      onDoubleClick: () => this.disabled
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
    this.panzoom?.moveTo(0, 0)
    this.panzoom?.zoomAbs(0, 0, 1)
  }

  keepFocus () {
    if (!this.isMobileViewport) {
      this.container.focus()
    }
  }
}
</script>

<style lang="scss" scoped>
  .preview-options,
  .preview-name {
    position: absolute;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.75);
    font-weight: 100;
  }

  .preview-options {
    top: 0;
    border-bottom-right-radius: 4px;
  }
  .preview-name {
    bottom: 0;
    border-top-right-radius: 4px;
  }

  .theme--light {
    .preview-options,
    .preview-name {
      background: rgba(255, 255, 255, 0.75);
    }
  }

  :deep(.v-input__slot) {
    overflow: hidden;
    max-height: calc(100vh - 398px);
    max-height: calc(100svh - 398px);
    min-height: 250px !important;
    aspect-ratio: 1;

    svg {
      shape-rendering: geometricPrecision;

      .layer > path {
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    }
  }
</style>
