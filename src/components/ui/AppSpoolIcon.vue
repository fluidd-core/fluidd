<template>
  <svg
    class="app-spool-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    role="img"
    v-on="$listeners"
  >
    <defs v-if="isMultiColor">
      <clipPath :id="clipId">
        <path :d="iconPath" />
      </clipPath>
      <linearGradient
        v-if="!isCoaxial"
        :id="gradientId"
        x1="0%"
        y1="0%"
        x2="0%"
        y2="100%"
      >
        <stop
          v-for="(stop, index) in gradientStops"
          :key="index"
          :offset="stop.offset"
          :stop-color="stop.color"
        />
      </linearGradient>
    </defs>

    <g
      v-if="isMultiColor && isCoaxial"
      :clip-path="`url(#${clipId})`"
    >
      <path
        v-for="(segment, index) in coaxialSegments"
        :key="index"
        :d="segment.d"
        :fill="segment.color"
      />
    </g>

    <path
      class="app-spool-icon__filament"
      :d="iconPath"
      :fill="fill"
    />
  </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Icons } from '@/globals'

type CoaxialSegment = {
  color: string
  d: string
}

type GradientStop = {
  offset: string
  color: string
}

// the filament icon is a circle of radius 10 centered on (12, 12); the
// coaxial wedges reach past it and get clipped to the icon's shape
const CENTER = 12
const RADIUS = 12

let instanceCount = 0

@Component({
  inheritAttrs: false
})
export default class AppSpoolIcon extends Vue {
  @Prop({ type: Array, required: true })
  readonly colors!: string[]

  @Prop({ type: String })
  readonly multiColorDirection?: Moonraker.Spoolman.FilamentMultiColorDirection

  @Prop({ type: [Number, String], default: 24 })
  readonly size!: number | string

  // clip path and gradient ids must be unique document-wide, not just within the svg
  readonly instanceId = ++instanceCount

  readonly iconPath = Icons.filament

  get clipId(): string {
    return `app-spool-icon-clip-${this.instanceId}`
  }

  get gradientId(): string {
    return `app-spool-icon-gradient-${this.instanceId}`
  }

  get isMultiColor(): boolean {
    return this.colors.length > 1
  }

  get isCoaxial(): boolean {
    return this.multiColorDirection === 'coaxial'
  }

  get fill(): string {
    if (!this.isMultiColor) return this.colors[0] ?? 'currentColor'

    // coaxial colors are drawn by the clipped wedges; the icon path only keeps the outline
    if (this.isCoaxial) return 'none'

    return `url(#${this.gradientId})`
  }

  get coaxialSegments(): CoaxialSegment[] {
    const count = this.colors.length
    const anglePerSegment = (2 * Math.PI) / count
    // start with the first border between two colors at 12 o'clock
    const rotate = -Math.PI / 2

    return this.colors.map((color, index) => {
      const start = index * anglePerSegment + rotate
      const end = (index + 1) * anglePerSegment + rotate
      const x1 = CENTER + RADIUS * Math.cos(start)
      const y1 = CENTER + RADIUS * Math.sin(start)
      const x2 = CENTER + RADIUS * Math.cos(end)
      const y2 = CENTER + RADIUS * Math.sin(end)
      const largeArc = anglePerSegment > Math.PI ? 1 : 0

      return {
        color,
        d: `M${CENTER} ${CENTER}L${x1} ${y1}A${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2}Z`
      }
    })
  }

  get gradientStops(): GradientStop[] {
    const count = this.colors.length

    return this.colors.map((color, index) => ({
      offset: `${(index / (count - 1)) * 100}%`,
      color
    }))
  }
}
</script>

<style lang="scss" scoped>
.app-spool-icon {
  display: inline-block;
  flex: 0 0 auto;
  vertical-align: middle;
}

.app-spool-icon__filament {
  stroke: rgba(0, 0, 0, 0.25);
  stroke-width: 0.025rem;
}

.theme--dark .app-spool-icon__filament {
  stroke: rgba(0, 0, 0, 0.5);
}
</style>
