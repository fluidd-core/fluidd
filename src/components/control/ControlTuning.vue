<template>
  <control-card
    title="Motion tuning"
    :locked="klippyReady ? '' : notReadyReason"
    :note="klippyReady ? note : ''"
    data-tid="control-tuning"
  >
    <template
      v-if="hasShaper"
      #aside
    >
      <button
        type="button"
        class="tune__link"
        :disabled="!klippyReady"
        data-tid="control-shaper-read"
        @click="readShaper"
      >
        Read what it's using
      </button>
    </template>

    <div
      v-if="hasShaper"
      class="tune__group"
      data-tid="control-shaper"
    >
      <h3 class="tune__label">
        Input shaper <span class="crow__sub">· {{ shaperSource }}</span>
      </h3>
      <div
        v-for="axis in axes"
        :key="axis"
        class="crow"
      >
        <span class="crow__name">{{ axis.toUpperCase() }}</span>
        <span class="tune__pair">
          <select
            class="tune__select"
            :value="shaper(axis).type"
            :aria-label="`${axis.toUpperCase()} shaper`"
            :disabled="!klippyReady"
            @change="onShaperType(axis, $event)"
          >
            <option
              v-for="type in shaperTypes(axis)"
              :key="type"
              :value="type"
            >
              {{ type }}
            </option>
          </select>
          <number-field
            :value="shaper(axis).freq"
            unit="Hz"
            :min="0"
            :max="300"
            :decimals="1"
            :label="`${axis.toUpperCase()} shaper frequency`"
            :disabled="!klippyReady"
            @change="setShaper(axis, { freq: $event })"
          />
        </span>
      </div>
    </div>

    <div
      v-if="retraction"
      class="tune__group"
      data-tid="control-retraction"
    >
      <h3 class="tune__label">
        Firmware retraction <span class="crow__sub">· G10 and G11</span>
      </h3>
      <div
        v-for="row in retractionRows"
        :key="row.key"
        class="crow"
      >
        <span class="crow__name">{{ row.label }}</span>
        <number-field
          :value="row.value"
          :unit="row.unit"
          :min="0"
          :max="row.max"
          :decimals="row.decimals"
          :label="row.label"
          :disabled="!klippyReady"
          @change="setRetraction(row.key, $event)"
        />
      </div>
    </div>

    <p
      v-if="!hasShaper && !retraction"
      class="tune__none"
    >
      There's no input shaper or firmware retraction in this printer's printer.cfg.
    </p>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import type { ConsoleEntry } from '@/store/console/types'
import {
  SHAPER_TYPES, configShaper, parseShaperReport, retractionCommand, shaperCommand,
  type AxisShaper, type RetractionKey, type ShaperAxis
} from '@/services/control/model'
import ControlCard from './ControlCard.vue'
import NumberField from './NumberField.vue'

/** How far back in the console to look for the shapers Klipper last reported. */
const REPORT_LINES = 200

/**
 * Pro's motion tuning: the input shaper on each axis (Klipper keeps no
 * status for it, so it shows printer.cfg's until Klipper reports its own,
 * which any SET_INPUT_SHAPER does) and firmware retraction. Both last
 * until Klipper restarts.
 */
@Component({ components: { ControlCard, NumberField } })
export default class ControlTuning extends Mixins(ControlMixin) {
  get axes (): ShaperAxis[] {
    return ['x', 'y']
  }

  get shaperSettings (): Record<string, unknown> | undefined {
    return this.$store.state.printer.printer.configfile?.settings?.input_shaper
  }

  get hasShaper (): boolean {
    return !!this.shaperSettings
  }

  /** The newest report of each axis, from the console's last lines. */
  get reported (): Partial<Record<ShaperAxis, AxisShaper>> {
    const entries = (this.$store.state.console.console as ConsoleEntry[] | undefined) ?? []
    const found: Partial<Record<ShaperAxis, AxisShaper>> = {}
    for (let i = entries.length - 1; i >= Math.max(0, entries.length - REPORT_LINES); i--) {
      const report = parseShaperReport(entries[i].message ?? '')
      if (!found.x && report.x) found.x = report.x
      if (!found.y && report.y) found.y = report.y
      if (found.x && found.y) break
    }
    return found
  }

  get shaperSource (): string {
    return this.reported.x || this.reported.y ? 'as Klipper last reported' : 'from printer.cfg'
  }

  shaper (axis: ShaperAxis): AxisShaper {
    return this.reported[axis] ?? configShaper(this.shaperSettings, axis) ?? { type: 'mzv', freq: 0 }
  }

  /** Klipper's shapers, and whatever this one is set to if it's one of its own. */
  shaperTypes (axis: ShaperAxis): string[] {
    const type = this.shaper(axis).type
    return SHAPER_TYPES.includes(type) ? SHAPER_TYPES : [...SHAPER_TYPES, type]
  }

  setShaper (axis: ShaperAxis, change: Partial<AxisShaper>) {
    this.sendGcode(shaperCommand(axis, { ...this.shaper(axis), ...change }))
  }

  onShaperType (axis: ShaperAxis, event: Event) {
    this.setShaper(axis, { type: (event.target as HTMLSelectElement).value })
  }

  /** SET_INPUT_SHAPER with no values only reports them. */
  readShaper () {
    this.sendGcode('SET_INPUT_SHAPER')
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
    this.sendGcode(retractionCommand(key, value))
  }

  get note (): string {
    return 'These last until Klipper restarts. Maintenance measures the shaper; keep what you settle on in Files › printer.cfg.'
  }
}
</script>

<style lang="scss" scoped>
  .tune__group {
    display: flex;
    flex-direction: column;

    > .crow + .crow {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .tune__label {
    margin: 0 0 4px;
    color: var(--m3d-text);
    font-size: 13px;
    font-weight: 600;
  }

  .tune__pair {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .tune__select {
    height: 34px;
    padding: 0 10px;
    border: 0;
    border-radius: 9px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
  }

  .tune__link {
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;

    &:disabled {
      opacity: 0.45;
    }
  }

  .tune__none {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }
</style>
