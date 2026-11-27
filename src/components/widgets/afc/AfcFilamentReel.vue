<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    x="0"
    y="0"
    viewBox="0 0 256 500"
    xml:space="preserve"
    width="100"
    height="80"
    @click="clickSpool"
  >
    <defs>
      <linearGradient
        v-if="isMultiColor"
        :id="gradientId"
        v-bind="gradientVector"
      >
        <stop
          v-for="stop in gradientStops"
          :key="`stop:${stop.offset}`"
          :offset="stop.offset"
          :stop-color="stop.color"
        />
      </linearGradient>
    </defs>

    <path
      id="spool_right_rim"
      d="M202.1.3h-5v2.3C179 19 165 123.6 165 250s14 231.1 32.2 247.5v2.3h5c20.5 0 37.2-111.9 37.2-249.8S222.7.3 202.1.3"
      :style="{ fill: spoolRimColor }"
    />

    <path
      id="spool_right"
      d="M197.1.3c20.5 0 37.2 111.9 37.2 249.8s-16.7 249.8-37.2 249.8S160 387.9 160 250 176.6.3 197.1.3"
      :style="{ fill: spoolColor }"
    />

    <path
      id="spool_tube"
      d="m194.6 166.9-145.5.1c6.9 0 12.4 37.2 12.4 83.2 0 44.1-5.1 80.3-11.6 83h144.7c6.9 0 12.4-37.2 12.4-83.2 0-45.8-5.6-83.1-12.4-83.1"
      :style="{ fill: spoolTubeColor }"
    />

    <path
      id="filament_base"
      d="M35 31c18.8-12.1 138-10.4 162.1 0 24.9 10.4 41.1 398.9 0 438.1-37.2 12.2-147.7 11.4-162.1 0C22 458.8 16.2 43 35 31"
      :style="styleReel"
    />

    <path
      id="spool_left_rim"
      d="M42.5.3h-5v2.3C19.3 19 5.3 123.6 5.3 250s14 231.1 32.2 247.5v2.3h5c20.5 0 37.2-111.9 37.2-249.8S63 .3 42.5.3"
      :style="{ fill: spoolRimColor }"
    />

    <path
      id="spool_left"
      d="M37.5.3C58 .3 74.6 112.2 74.6 250S58 499.8 37.5 499.8.3 387.9.3 250 16.9.3 37.5.3"
      :style="{ fill: spoolColor }"
    />

    <path
      id="spool_hole"
      d="M35.5 171.6c6.5 0 11.6 35.1 11.6 78.4s-5.3 78.4-11.6 78.4-11.6-35.1-11.6-78.4 5.1-78.4 11.6-78.4"
      :style="{ fill: spoolHoleColor }"
    />
  </svg>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

type GradientStop = {
  offset: string
  color: string
}

type GradientVector =
  | { gradientUnits: 'userSpaceOnUse'; x1: number; y1: number; x2: number; y2: number }
  | { x1: string; y1: string; x2: string; y2: string }

let instanceCount = 0

@Component
export default class AfcFilamentReel extends Mixins(StateMixin) {
  @Prop({ type: Number, default: 100 })
  readonly percent!: number

  // a single-color spool is a one-entry array
  @Prop({ type: Array, default: () => [] })
  readonly colors!: string[]

  @Prop({ type: String })
  readonly multiColorDirection?: Moonraker.Spoolman.FilamentMultiColorDirection

  // gradient ids need to be unique document-wide, not just within the scope of the svg
  readonly instanceId = ++instanceCount

  readonly gradientId = `afc-filament-reel-gradient-${this.instanceId}`

  spoolColor = '#c08f4f'
  spoolHoleColor = '#231a0f'
  spoolTubeColor = '#594226'
  spoolRimColor = '#9b7242'

  get isMultiColor(): boolean {
    return this.colors.length > 1
  }

  get isCoaxial(): boolean {
    return this.multiColorDirection === 'coaxial'
  }

  get gradientVector(): GradientVector {
    // coaxial: colors side by side; the bands span only the visible filament
    // (x 75 to 197), because the spool sides hide the rest
    if (this.isCoaxial) return { gradientUnits: 'userSpaceOnUse', x1: 75, y1: 0, x2: 197, y2: 0 }

    // longitudinal (and unknown directions): colors change from top to bottom
    return { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
  }

  get gradientStops(): GradientStop[] {
    const colors = this.colors
    const count = colors.length

    // coaxial: each color solid at the center of its band, blending into the next
    if (this.isCoaxial) {
      return colors.map((color, i) => ({
        offset: `${((i + 0.5) / count) * 100}%`,
        color
      }))
    }

    // longitudinal: smooth transition between the colors
    return colors.map((color, i) => ({
      offset: `${(i / (count - 1)) * 100}%`,
      color
    }))
  }

  get filamentFill(): string {
    if (this.isMultiColor) return `url(#${this.gradientId})`

    return this.colors[0] ?? '#ff0'
  }

  get styleReel() {
    const minScale = 0.37 // 37% is the minimum visible size
    const centerX = 128 // Center X of the SVG
    const centerY = 250 // Center Y of the SVG

    const style = {
      fill: 'transparent',
      stroke: 'black',
      strokeWidth: '0',
      transformOrigin: `${centerX}px ${centerY}px`,
      transform: `scale(1, ${minScale})`
    }

    // If percent greater than 0, set fill to color and apply scaling
    if (this.percent > 0) {
      style.fill = this.filamentFill

      const scaleY = minScale + (this.percent / 100) * (1 - minScale)
      style.transform = `scale(1, ${scaleY})`

      // Apply stroke if color is not transparent
      if (style.fill === 'transparent') style.strokeWidth = '3px'
    }

    return style
  }

  clickSpool() {
    this.$emit('click-spool')
  }
}
</script>
