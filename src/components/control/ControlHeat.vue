<template>
  <control-card
    title="Heat"
    :locked="controlLock"
    note="Pick a material to heat both. The table is kept on the printer, so the panel, this page and the app agree."
    data-tid="control-heat"
  >
    <template #aside>
      <details class="heat__more">
        <summary
          class="cbtn"
          aria-label="Heat options"
        >
          More
        </summary>
        <a
          class="heat__edit"
          :href="materialsLink"
          @click.prevent="$router.push(materialsLink)"
        >Edit materials</a>
      </details>
    </template>

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
      class="heat__steppers"
    >
      <div
        v-for="h in steppers"
        :key="`${panelTarget}|${h.heater.name}`"
        class="heat__stepper"
      >
        <span class="heat__stepper-name">{{ h.label }} <span class="crow__sub">{{ deg1(h.heater.temperature) }} · power {{ Math.round((h.heater.power || 0) * 100) }}%</span></span>
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
        <number-field
          :value="Math.round(h.heater.target)"
          unit="°C"
          :min="0"
          :max="h.heater.maxTemp || 300"
          :label="`${h.label} target`"
          :disabled="!ready"
          @change="setHeater(h.heater, $event)"
        />
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
      type="button"
      class="cbtn cbtn--wide"
      :disabled="!ready"
      @click="coolDown"
    >
      Cool down
    </button>

    <control-task-fold
      v-if="otherTemperatures.length"
      fold-key="heat.other"
      title="Other temperatures"
      :summary="`${otherTemperatures.length} sensors`"
    >
      <div
        v-for="sensor in otherTemperatures"
        :key="sensor.name"
        class="crow"
      >
        <span class="crow__name">{{ sensor.prettyName || sensor.name }}</span>
        <number-field
          v-if="otherHeater(sensor.name)"
          :key="panelTarget"
          :value="sensor.target"
          unit="°C"
          :min="0"
          :max="sensor.maxTemp || 300"
          :label="`${sensor.prettyName || sensor.name} target`"
          :disabled="!ready"
          @change="setHeater(otherHeater(sensor.name), $event)"
        />
        <b class="crow__value">{{ deg1(sensor.temperature) }}</b>
      </div>
    </control-task-fold>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import ControlMixin, { BED_FLOOR, NOZZLE_FLOOR } from '@/mixins/control'
import { stepTarget } from '@/services/control/model'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import type { Heater, Sensor } from '@/store/printer/types'

import ControlTaskFold from './ControlTaskFold.vue'
import ControlCard from './ControlCard.vue'
import NumberField from './NumberField.vue'

interface Stepper {
  heater: Heater;
  label: string;
  floor: number;
}

/**
 * Materials, nudges and exact targets share one panel at every width.
 */
@Component({ components: { ControlCard, NumberField, ControlTaskFold } })
export default class ControlHeat extends Mixins(ControlMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  get ready (): boolean {
    return this.controlReady
  }

  get otherTemperatures (): Array<Sensor & Partial<Heater>> {
    return [...this.heaters.filter(h => h.name !== this.nozzle?.name && h.name !== this.bed?.name),
      ...((this.$store.getters['printer/getSensors'] as Sensor[]) ?? []),
      ...this.fans.filter(f => typeof f.temperature === 'number').map(f => ({ ...f, temperature: f.temperature ?? 0 }))]
  }

  otherHeater (name: string): Heater | null { return this.heaters.find(h => h.name === name) ?? null }

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
}
</script>

<style lang="scss" scoped>
  .heat__more { position: relative; }
  .heat__more .heat__edit { position: absolute; right: 0; top: 100%; z-index: 10; min-width: 140px; padding: 12px; border: 1px solid var(--m3d-border); border-radius: 12px; background: var(--m3d-surface); }
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
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .heat__stepper {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 60px;
    padding: 0 6px 0 12px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
  }

  .heat__stepper-name {
    flex: 1 1 auto;
    font-size: 14px;
    font-weight: 500;
    .crow__sub { display: block; font-size: 11px; }
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
