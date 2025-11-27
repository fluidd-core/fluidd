<template>
  <svg
    ref="mmuSpoolSvg"
    viewBox="0 0 248 500"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <path
        id="oval"
        d="M0-63c35 0 63 28 63 63S35 63 0 63-63 35-63 0s28-63 63-63"
        vector-effect="non-scaling-stroke"
      />
      <path
        id="center"
        d="M0-63c35 0 63 28 63 63S35 63 0 63h-624V-63z"
        vector-effect="non-scaling-stroke"
      />
      <path
        id="espool"
        d="M89.561 35.5 60.333 15.734a.999.999 0 0 0-1.56.828v7.987c-12.038.262-26.306 5.201-37.501 13.023C7.554 47.155 0 59.894 0 73.438a1.001 1.001 0 0 0 1.911.412c7.823-17.312 26.952-26.183 56.861-26.376v8.62a.999.999 0 0 0 1.56.828L89.56 37.156c.275-.185.44-.495.44-.827s-.165-.643-.439-.829"
        stroke-width="2"
        stroke="#CCCCCC"
        fill="#808080"
        opacity="0.7"
      />
    </defs>

    <filter
      id="blur_wheel2"
      width="1.3"
      height="1.16"
    >
      <feGaussianBlur
        in="SourceAlpha"
        stdDeviation="3"
      />
      <feOffset
        dx="18"
        dy="0"
        result="oBlur"
      />
      <feFlood
        flood-color="#000"
        flood-opacity=".67"
      />
      <feComposite
        in2="oBlur"
        operator="in"
      />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <g transform="matrix(0.59,0,0,3.95,197,250)">
      <use
        href="#oval"
        style="filter: url(#blur_wheel2)"
        :fill="spoolWheelColor"
      />
      <use
        href="#oval"
        transform="scale(0.41)"
        style="filter: url(#blur_wheel2)"
        :fill="spoolWheelColor"
      />
      <use
        href="#center"
        transform="scale(0.41)"
        :fill="spoolWheelColor"
      />
    </g>
    <path
      v-if="filamentAmount !== 0 || details.status !== GATE_EMPTY"
      ref="filament"
      d="M0-63c35 0 63 28 63 63S35 63 0 63h-424V-63z"
      vector-effect="non-scaling-stroke"
      :fill="filamentColor"
      :transform="'matrix(' + computedScale(0.28, 0.4) + ',0,0,' + computedScale(1.65, 3.5) + ',197,250)'"
    />
    <g transform="matrix(0.59,0,0,3.95,37,250)">
      <use
        href="#oval"
        style="filter: url(#blur_wheel2)"
        :fill="spoolWheelColor"
      />
      <use
        href="#oval"
        transform="scale(0.41)"
        style="fill: #111111"
      />
    </g>

    <g v-if="!editGateMap">
      <text
        v-if="filamentAmount > 0"
        x="152"
        y="270"
        text-anchor="middle"
        font-weight="bold"
        font-size="56px"
        :fill="contrastColor"
      >
        {{ filamentAmount }}%
      </text>
      <text
        v-else-if="filamentAmount === 0 && details.status !== GATE_EMPTY"
        x="140"
        y="310"
        text-anchor="middle"
        font-weight="bold"
        font-size="160px"
        style="fill: red; stroke: #111111; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round"
      >
        !
      </text>
      <use
        v-if="espoolerActive === ESPOOLER_REWIND && gateIndex === gate"
        href="#espool"
        transform="translate(225,0) rotate(90) scale(2,2)"
      />
      <use
        v-if="espoolerActive === ESPOOLER_ASSIST && gateIndex === gate"
        href="#espool"
        transform="translate(225,500) rotate(270) scale(2,-2)"
      />
    </g>
  </svg>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins, Prop, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'
import type { MmuGateDetails } from '@/types'
import { TinyColor } from '@ctrl/tinycolor'

@Component({})
export default class MmuSpool extends Mixins(StateMixin, MmuMixin) {
  @Prop({ required: true, default: -1 })
  readonly gateIndex!: number

  @Prop({ required: false, default: '#AD8762' })
  readonly spoolWheelColor!: string

  @Prop({ required: false, default: null })
  readonly editGateMap!: MmuGateDetails[] | null

  @Prop({ required: false, default: -1 })
  readonly editGateSelected!: number

  @Ref('filament')
  readonly filamentRef!: Element

  get details (): MmuGateDetails {
    if (this.editGateMap) return this.editGateMap[this.gateIndex]
    return this.gateDetails(this.gateIndex)
  }

  get showUnavailableSpoolColor (): boolean {
    return this.$typedState.config.uiSettings.mmu.showUnavailableSpoolColor
  }

  get filamentAmount (): number {
    if (this.editGateMap) return 100
    if (this.details.status === this.GATE_EMPTY && !(this.showUnavailableSpoolColor && this.details.color !== this.NO_FILAMENT_COLOR)) return 0

    const spoolmanSpool = this.spoolmanSpool(this.details.spoolId)
    if (!spoolmanSpool) return -1

    if (!this.details.spoolId || this.details.spoolId <= 0 || this.spoolmanSupport === 'off') return -1

    // Pull live from spoolman and calculate percentage
    const remaining = spoolmanSpool?.remaining_weight ?? null
    // Technically this is what spoolman implements but not available in Fluidd:
    //   const total = spoolmanSpool?.initial_weight ?? spoolmanSpool?.filament?.weight ?? null
    const total = spoolmanSpool?.filament?.weight ?? null
    if (remaining === null || total === null) return -1
    return Math.ceil(Math.max(0, Math.min(100, (remaining / total) * 100)))
  }

  get filamentColor (): string {
    return this.details.color
  }

  computedScale (start: number, end: number) {
    if (this.editGateMap || this.filamentAmount < 0) return end
    return start + (end - start) * (this.filamentAmount / 100)
  }

  get contrastColor (): string {
    return new TinyColor(this.filamentColor).getLuminance() > 0.5 ? 'black' : 'white'
  }
}
</script>
