<template>
  <control-card
    title="Speed"
    :locked="controlLock"
    :note="controlReady ? speedNote : ''"
    data-tid="control-speed"
  >
    <template #aside>
      <span>while printing</span>
    </template>
    <seg-picker
      :options="speedOptions"
      :value="speedFactor"
      label="Speed presets"
      big
      accent
      fill
      :disabled="!controlReady"
      @input="setSpeed"
    />
    <template v-if="!simple">
      <button
        type="button"
        class="speed__custom"
        data-tid="speed-custom"
        :aria-expanded="custom || isCustom ? 'true' : 'false'"
        aria-controls="speed-custom-value"
        @click="custom = !custom"
      >
        Custom · {{ speedFactor }}%
      </button>
      <div
        v-show="custom || isCustom"
        id="speed-custom-value"
      >
        <number-field
          :key="panelTarget"
          :value="speedFactor"
          unit="%"
          :min="1"
          :max="500"
          label="Speed"
          :disabled="!controlReady"
          @change="setSpeed"
        />
      </div>
      <control-task-fold
        fold-key="speed.fine"
        title="Fine-tune"
        :summary="`Flow ${flowFactor}%${pressureAdvance === null ? '' : ` · PA ${pressureAdvance} s`}`"
      >
        <tuning-value
          :context="panelTarget"
          label="Flow"
          :value="flowFactor"
          unit="%"
          :min="1"
          :max="300"
          :disabled="!controlReady"
          @change="setFlow"
        />
        <tuning-value
          v-if="pressureAdvance !== null"
          :context="panelTarget"
          label="Pressure advance"
          :value="pressureAdvance"
          unit="s"
          :max="2"
          :decimals="3"
          :disabled="!controlReady"
          @change="setPressureAdvance"
        />
        <tuning-value
          v-for="limit in limits"
          :key="limit.key"
          :context="panelTarget"
          :label="limit.label"
          :value="limit.value"
          :unit="limit.unit"
          :min="['VELOCITY', 'ACCEL'].includes(limit.key) ? 0.001 : 0"
          :max="limit.max ?? 0"
          :decimals="limit.decimals"
          :disabled="!controlReady || limit.max === null"
          :reason="limit.max === null ? limitReason : ''"
          @change="setLimit(limit.key, $event)"
        />
        <h3
          v-if="retractionRows.length"
          class="speed__retract"
        >
          Firmware retraction · G10 and G11
        </h3>
        <tuning-value
          v-for="row in retractionRows"
          :key="row.key"
          :context="panelTarget"
          :label="row.label"
          :value="row.value"
          :unit="row.unit"
          :min="row.key.endsWith('speed') ? 0.1 : 0"
          :max="row.max"
          :decimals="row.decimals"
          :disabled="!controlReady"
          @change="setRetraction(row.key, $event)"
        />
        <p class="speed__lifetime">
          These values last until Klipper restarts. To keep them, save them in Files › printer.cfg. Put back remembers this visit's previous value.
        </p>
      </control-task-fold>
    </template>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import ControlMixin, { type LimitKey } from '@/mixins/control'
import { leftAt } from '@/services/control/speed'
import { shortDuration } from '@/util/short-duration'
import type { TimeEstimates } from '@/store/printer/types'
import ControlCard from './ControlCard.vue'
import SegPicker, { type SegOption } from './SegPicker.vue'
import NumberField from './NumberField.vue'
import ControlTaskFold from './ControlTaskFold.vue'
import TuningValue from './TuningValue.vue'
import { retractionCommand, type RetractionKey } from '@/services/control/model'

/** Presets and an exact custom value, with reversible tuning beside them. */
@Component({ components: { ControlCard, SegPicker, NumberField, ControlTaskFold, TuningValue } })
export default class ControlSpeed extends Mixins(ControlMixin) {
  custom = false

  /** Overview can retain its compact preset card. */
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
  get limitReason (): string {
    return "This printer hasn't reported its limits"
  }

  get limits (): Array<{ key: LimitKey, label: string, value: number | null, unit: string, decimals: number, max: number | null }> {
    const t = this.toolhead
    const row = (key: LimitKey, label: string, value: number | null, unit: string, decimals: number) => {
      const max = this.limitMaximum(key)
      return { key, label, value, unit, decimals, max }
    }
    const list = [
      row('VELOCITY', 'Velocity', t.max_velocity ?? null, 'mm/s', 0),
      row('ACCEL', 'Acceleration', t.max_accel ?? null, 'mm/s²', 0),
      row('SQUARE_CORNER_VELOCITY', 'Square corner velocity', t.square_corner_velocity ?? null, 'mm/s', 1)
    ]
    if (typeof t.minimum_cruise_ratio === 'number') {
      const ratio = row('MINIMUM_CRUISE_RATIO', 'Minimum cruise ratio', t.minimum_cruise_ratio, '', 2)
      list.push(ratio)
    } else if (typeof t.max_accel_to_decel === 'number') {
      const accelToDecel = row('ACCEL_TO_DECEL', 'Accel to decel', t.max_accel_to_decel, 'mm/s²', 0)
      list.push(accelToDecel)
    }
    return list
  }

  get retraction (): Record<RetractionKey, number> | null {
    return this.$store.state.printer.printer.firmware_retraction ?? null
  }

  get retractionRows (): Array<{ key: RetractionKey, label: string, value: number, unit: string, max: number, decimals: number }> {
    const r = this.retraction
    if (!r) return []
    return [
      { key: 'retract_length', label: 'Retract', value: r.retract_length, unit: 'mm', max: 15, decimals: 2 },
      { key: 'retract_speed', label: 'Retract speed', value: r.retract_speed, unit: 'mm/s', max: 200, decimals: 0 },
      { key: 'unretract_extra_length', label: 'Extra on the way back', value: r.unretract_extra_length, unit: 'mm', max: 5, decimals: 2 },
      { key: 'unretract_speed', label: 'Unretract speed', value: r.unretract_speed, unit: 'mm/s', max: 200, decimals: 0 }
    ]
  }

  setRetraction (key: RetractionKey, value: number) {
    const row = this.retractionRows.find(r => r.key === key)
    if (!this.controlReady || !row || !Number.isFinite(value) || value < (key.endsWith('speed') ? 0.1 : 0) || value > row.max) return
    this.sendGcode(retractionCommand(key, value))
  }
}
</script>

<style lang="scss" scoped>
  .speed__custom { color: var(--m3d-accent); text-align: left; }
  .speed__retract { font-size: 14px; }
  .speed__lifetime { color: var(--m3d-text-subtle); font-size: 12px; }
  .limits > .crow + .crow {
    border-top: 1px solid var(--m3d-border);
  }
</style>
