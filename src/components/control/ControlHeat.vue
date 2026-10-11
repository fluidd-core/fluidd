<template>
  <control-card
    title="Heat"
    :locked="ready ? '' : notReadyReason"
    :note="pro || !ready ? '' : 'Pick a material to heat both. The table is kept on the printer, so the panel, this page and the app agree.'"
    data-tid="control-heat"
  >
    <template #aside>
      <template v-if="pro">
        <a
          class="heat__edit"
          :href="materialsLink"
          @click.prevent="$router.push(materialsLink)"
        >Edit materials</a>
      </template>
      <template v-else>
        <span v-if="nozzle">Nozzle <b>{{ deg(nozzle.temperature) }}</b></span>
        <span v-if="bed">· Bed <b>{{ deg(bed.temperature) }}</b></span>
      </template>
    </template>

    <!-- Simple: a material heats both; − and + for each. -->
    <template v-if="!pro">
      <div
        class="heat__materials"
        :class="{ 'heat__materials--phone': phone }"
      >
        <button
          v-for="m in materials"
          :key="m.id"
          type="button"
          class="heat__material"
          :class="{ 'heat__material--on': material && material.id === m.id }"
          :disabled="!ready"
          :data-tid="`material-${m.name}`"
          @click="applyMaterial(m)"
        >
          <span class="heat__material-name">{{ m.name }}</span>
          <span class="heat__material-temps">{{ m.nozzle }}°<template v-if="m.bed !== null"> · {{ m.bed }}°</template></span>
        </button>
        <p
          v-if="!materials.length"
          class="heat__none"
        >
          No materials yet. Add them in Settings › Thermal presets.
        </p>
      </div>
      <div
        v-if="!phone"
        class="heat__steppers"
      >
        <div
          v-for="h in steppers"
          :key="h.heater.name"
          class="heat__stepper"
        >
          <span class="heat__stepper-name">{{ h.label }}</span>
          <button
            type="button"
            class="heat__step"
            :aria-label="`${h.label} cooler`"
            :disabled="!ready || !h.heater.target"
            @click="setHeater(h.heater, nextTarget(h, -1))"
          >
            <frame-icon
              name="minus"
              small
            />
          </button>
          <span class="heat__stepper-value">{{ h.heater.target ? `${Math.round(h.heater.target)}°` : 'Off' }}</span>
          <button
            type="button"
            class="heat__step"
            :aria-label="`${h.label} hotter`"
            :disabled="!ready"
            @click="setHeater(h.heater, nextTarget(h, 1))"
          >
            <frame-icon
              name="plus"
              small
            />
          </button>
        </div>
      </div>
      <button
        v-else
        type="button"
        class="cbtn cbtn--wide"
        :disabled="!ready"
        @click="coolDown"
      >
        Cool down
      </button>
    </template>

    <!-- Pro: each heater's exact target, the materials as chips, the extruder. -->
    <template v-else>
      <div class="heat__rows">
        <div
          v-for="h in steppers"
          :key="h.heater.name"
          class="crow"
        >
          <span class="crow__name">
            {{ h.label }}
            <span class="crow__sub"> · {{ deg1(h.heater.temperature) }} · power {{ Math.round((h.heater.power || 0) * 100) }}%</span>
          </span>
          <number-field
            :value="Math.round(h.heater.target)"
            unit="°C"
            :min="0"
            :max="h.heater.maxTemp || 500"
            :label="`${h.label} target`"
            :disabled="!ready"
            @change="setHeater(h.heater, $event)"
          />
        </div>
        <div
          v-if="chamber"
          class="crow"
        >
          <span class="crow__name">
            Chamber <span class="crow__sub">(reading only)</span>
          </span>
          <b class="crow__value">{{ deg1(chamber.temperature) }}</b>
        </div>
      </div>
      <div class="heat__chips">
        <button
          v-for="m in materials"
          :key="m.id"
          type="button"
          class="heat__chip"
          :class="{ 'heat__chip--on': material && material.id === m.id }"
          :disabled="!ready"
          @click="applyMaterial(m)"
        >
          {{ m.name }} {{ m.nozzle }}<template v-if="m.bed !== null">
            · {{ m.bed }}
          </template>
        </button>
      </div>

      <div
        v-if="hasExtruder"
        class="heat__extruder"
      >
        <div class="heat__extruder-head">
          <h3>Extruder</h3>
          <span>nozzle must be over {{ minExtrude }}°</span>
        </div>
        <div class="crow">
          <span class="crow__name">Length</span>
          <seg-picker
            :options="lengthOptions"
            :value="length"
            label="Length"
            @input="length = $event"
          />
        </div>
        <div class="crow">
          <span class="crow__name">Speed</span>
          <number-field
            :value="speed"
            unit="mm/s"
            :min="0.1"
            :max="maxExtrudeSpeed"
            :decimals="speed % 1 ? 1 : 0"
            label="Extrude speed"
            @change="speed = $event"
          />
        </div>
        <div class="heat__extrude-buttons">
          <button
            type="button"
            class="cbtn cbtn--grow"
            :disabled="!canExtrude"
            data-tid="retract"
            @click="sendExtrudeGcode(-extrudeLength, speed)"
          >
            Retract
          </button>
          <button
            type="button"
            class="cbtn cbtn--grow"
            :disabled="!canExtrude"
            data-tid="extrude"
            @click="sendExtrudeGcode(extrudeLength, speed)"
          >
            Extrude
          </button>
        </div>
        <p
          v-if="extrudeReason"
          class="heat__reason"
        >
          <frame-icon
            name="lock"
            small
          />
          {{ extrudeReason }}
        </p>
      </div>
    </template>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import ControlMixin, { BED_FLOOR, NOZZLE_FLOOR } from '@/mixins/control'
import { extrudeBlocked, extrudeLengths, stepTarget } from '@/services/control/model'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import type { Heater } from '@/store/printer/types'
import ControlCard from './ControlCard.vue'
import SegPicker, { type SegOption } from './SegPicker.vue'
import NumberField from './NumberField.vue'

interface Stepper {
  heater: Heater;
  label: string;
  floor: number;
}

/**
 * Heat. Simple: the printer's materials (U5), one press heats nozzle and
 * bed; − and + nudge each. Pro: each heater's exact target, the chamber's
 * reading, the materials as chips, and the extruder.
 */
@Component({ components: { ControlCard, SegPicker, NumberField } })
export default class ControlHeat extends Mixins(ControlMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  length = this.$store.state.config.uiSettings.general.defaultExtrudeLength as number || 10
  speed = this.$store.state.config.uiSettings.general.defaultExtrudeSpeed as number || 5

  get ready (): boolean {
    return this.klippyReady
  }

  get steppers (): Stepper[] {
    const list: Stepper[] = []
    if (this.nozzle) list.push({ heater: this.nozzle, label: 'Nozzle', floor: NOZZLE_FLOOR })
    if (this.bed) list.push({ heater: this.bed, label: 'Bed', floor: BED_FLOOR })
    return list
  }

  nextTarget (s: Stepper, direction: 1 | -1): number {
    return stepTarget(Math.round(s.heater.target), direction, s.floor, s.heater.maxTemp ?? 300)
  }

  deg (t: number): string {
    return `${Math.round(t)}°`
  }

  deg1 (t: number): string {
    return `${(Math.round(t * 10) / 10).toFixed(1)}°`
  }

  get materialsLink (): string {
    return `${scopedPath('/settings', activeSlug())}#presets`
  }

  get lengthOptions (): SegOption[] {
    return extrudeLengths(this.maxExtrudeLength).map((v, i, all) => ({ value: v, label: i === all.length - 1 ? `${v} mm` : String(v) }))
  }

  /** The length chosen, kept within max_extrude_only_distance, which Klipper refuses past. */
  get extrudeLength (): number {
    return Math.min(this.length, this.maxExtrudeLength)
  }

  get minExtrude (): number {
    return Math.round(this.activeExtruder?.min_extrude_temp ?? 170)
  }

  get extrudeReason (): string | null {
    if (!this.ready) return null
    if (this.busy) return 'Not while printing'
    return extrudeBlocked(this.activeExtruder?.temperature ?? 0, this.minExtrude, this.activeExtruder?.can_extrude)
  }

  get canExtrude (): boolean {
    return this.ready && !this.extrudeReason
  }
}
</script>

<style lang="scss" scoped>
  .heat__edit {
    color: var(--m3d-text-muted) !important;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }

  .heat__materials {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
    gap: 8px;
  }

  .heat__materials--phone {
    grid-template-columns: 1fr 1fr;
  }

  .heat__material {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    text-align: left;

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }

    &:hover:not(:disabled) {
      box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
    }
  }

  .heat__material--on {
    background: var(--m3d-accent-soft);
    box-shadow: inset 0 0 0 1.5px var(--m3d-accent) !important;
  }

  .heat__material-name {
    font-size: 15px;
    font-weight: 700;
  }

  .heat__material-temps {
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .heat__none {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .heat__steppers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .heat__stepper {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 48px;
    padding: 0 6px 0 12px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
  }

  .heat__stepper-name {
    flex: 1 1 auto;
    font-size: 14px;
    font-weight: 500;
  }

  .heat__stepper-value {
    min-width: 44px;
    font-size: 15px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }

  .heat__step {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    color: var(--m3d-text);

    &:hover:not(:disabled) {
      background: var(--m3d-hover);
    }

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }
  }

  .heat__rows > .crow + .crow,
  .heat__extruder > .crow + .crow {
    border-top: 1px solid var(--m3d-border);
  }

  .heat__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .heat__chip {
    height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .heat__chip--on {
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }

  .heat__extruder {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--m3d-border);
  }

  .heat__extruder-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;

    h3 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }

    span {
      color: var(--m3d-text-subtle);
      font-size: 12px;
    }
  }

  .heat__extrude-buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .heat__reason {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 4px 0 0;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }
</style>
