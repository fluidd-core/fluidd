<template>
  <control-card
    v-if="!pro || simple"
    title="Speed"
    :locked="klippyReady ? '' : notReadyReason"
    :note="klippyReady ? speedNote : ''"
    data-tid="control-speed"
  >
    <template #aside>
      <span>{{ isCustom ? `${speedName} · while printing` : 'while printing' }}</span>
    </template>
    <seg-picker
      :options="speedOptions"
      :value="speedFactor"
      label="Speed"
      big
      accent
      fill
      :disabled="!klippyReady"
      @input="setSpeed"
    />
  </control-card>

  <control-card
    v-else
    title="Speed and limits"
    :locked="klippyReady ? '' : notReadyReason"
    :note="klippyReady ? 'Velocity and below last until Klipper restarts. Save them in Files › printer.cfg.' : ''"
    data-tid="control-speed"
  >
    <div class="limits">
      <div class="crow">
        <span class="crow__name">Speed <span class="crow__sub">· {{ speedName }}</span></span>
        <number-field
          :value="speedFactor"
          unit="%"
          :min="1"
          :max="500"
          label="Speed"
          :disabled="!klippyReady"
          @change="setSpeed"
        />
      </div>
      <div class="crow">
        <span class="crow__name">Flow</span>
        <number-field
          :value="flowFactor"
          unit="%"
          :min="1"
          :max="300"
          label="Flow"
          :disabled="!klippyReady"
          @change="setFlow"
        />
      </div>
      <div
        v-if="pressureAdvance !== null"
        class="crow"
      >
        <span class="crow__name">Pressure advance</span>
        <number-field
          :value="pressureAdvance"
          unit="s"
          :min="0"
          :max="2"
          :decimals="3"
          label="Pressure advance"
          :disabled="!klippyReady"
          @change="setPressureAdvance"
        />
      </div>
      <div
        v-for="limit in limits"
        :key="limit.key"
        class="crow"
      >
        <span class="crow__name">{{ limit.label }}</span>
        <number-field
          :value="limit.value"
          :unit="limit.unit"
          :min="0"
          :decimals="limit.decimals"
          :label="limit.label"
          :disabled="!klippyReady"
          @change="setLimit(limit.key, $event)"
        />
      </div>
    </div>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import { leftAt } from '@/services/control/speed'
import { shortDuration } from '@/util/short-duration'
import type { TimeEstimates } from '@/store/printer/types'
import ControlCard from './ControlCard.vue'
import SegPicker, { type SegOption } from './SegPicker.vue'
import NumberField from './NumberField.vue'

type LimitKey = 'VELOCITY' | 'ACCEL' | 'SQUARE_CORNER_VELOCITY' | 'MINIMUM_CRUISE_RATIO' | 'ACCEL_TO_DECEL'

/**
 * Speed. Simple: Slow, Normal or Fast, each saying what it does and, while
 * printing, about how long is left at it (services/control/speed.ts: Slow
 * is half speed; Fast is as fast as the nozzle can melt this print's
 * filament). Pro: the exact speed and flow, pressure advance, and the
 * motion limits.
 */
@Component({ components: { ControlCard, SegPicker, NumberField } })
export default class ControlSpeed extends Mixins(ControlMixin) {
  /** Slow, Normal and Fast even with Pro on, as Overview on a phone shows them. */
  @Prop({ type: Boolean })
  readonly simple?: boolean

  /** Seconds left in the print, at the speed it runs now. */
  get secondsLeft (): number | null {
    if (!this.printerPrinting) return null
    const eta = (this.$store.getters['printer/getTimeEstimates'] as TimeEstimates).eta
    const left = (eta - Date.now()) / 1000
    return left > 60 ? left : null
  }

  get speedOptions (): SegOption[] {
    return this.speedChoices.map(c => ({
      value: c.percent,
      label: c.label,
      sub: this.secondsLeft ? `${shortDuration(leftAt(this.secondsLeft, this.speedFactor, c.percent))} left` : `${c.percent}%`
    }))
  }

  get speedName (): string {
    return this.speedLabel
  }

  get isCustom (): boolean {
    return !this.speedChoices.some(c => c.percent === this.speedFactor)
  }

  /** What the speed it runs at does; Fast's limit when there's no room for it. */
  get speedNote (): string {
    const choice = this.speedChoices.find(c => c.percent === this.speedFactor)
    if (choice) return choice.note
    if (!this.speedChoices.some(c => c.label === 'Fast')) return 'No Fast for this print: it is already as fast as the nozzle can melt the filament.'
    return 'Slow is half speed. Fast is as fast as the nozzle can melt the filament.'
  }

  /** Velocity, acceleration, corner speed, and whichever cruise setting this Klipper has. */
  get limits (): Array<{ key: LimitKey, label: string, value: number | null, unit: string, decimals: number }> {
    const t = this.toolhead
    const list: Array<{ key: LimitKey, label: string, value: number | null, unit: string, decimals: number }> = [
      { key: 'VELOCITY', label: 'Velocity', value: t.max_velocity ?? null, unit: 'mm/s', decimals: 0 },
      { key: 'ACCEL', label: 'Acceleration', value: t.max_accel ?? null, unit: 'mm/s²', decimals: 0 },
      { key: 'SQUARE_CORNER_VELOCITY', label: 'Square corner velocity', value: t.square_corner_velocity ?? null, unit: 'mm/s', decimals: 1 }
    ]
    if (typeof t.minimum_cruise_ratio === 'number') {
      list.push({ key: 'MINIMUM_CRUISE_RATIO', label: 'Minimum cruise ratio', value: t.minimum_cruise_ratio, unit: '', decimals: 2 })
    } else if (typeof t.max_accel_to_decel === 'number') {
      list.push({ key: 'ACCEL_TO_DECEL', label: 'Accel to decel', value: t.max_accel_to_decel, unit: 'mm/s²', decimals: 0 })
    }
    return list
  }
}
</script>

<style lang="scss" scoped>
  .limits > .crow + .crow {
    border-top: 1px solid var(--m3d-border);
  }
</style>
