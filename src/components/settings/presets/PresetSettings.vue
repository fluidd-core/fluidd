<template>
  <section
    id="presets"
    class="m3-set"
    data-tid="materials-settings"
  >
    <div class="m3-set__row mat__head">
      <div class="m3-set__label">
        <h2 class="m3-set__title">
          Materials
        </h2>
        <span>What Overview's Filament picker offers, at the temperatures Heat uses. The slicer starts from what's loaded.</span>
      </div>
      <div class="m3-set__control">
        <button
          type="button"
          class="cbtn"
          data-tid="material-add"
          @click="openAddDialog"
        >
          Add a material
        </button>
      </div>
    </div>

    <div
      v-for="preset in presets"
      :key="preset.id"
      class="m3-set__row"
      :data-tid="`material-row-${preset.name}`"
    >
      <span
        class="mat__swatch"
        :style="{ background: swatch(preset.name) }"
      />
      <div class="m3-set__label">
        <b>{{ preset.name }}</b>
        <span>{{ describe(preset) }}</span>
      </div>
      <div class="m3-set__control">
        <button
          type="button"
          class="cbtn cbtn--ghost"
          @click="openEditDialog(preset)"
        >
          Change
        </button>
        <button
          type="button"
          class="mat__remove"
          :aria-label="`Remove ${preset.name}`"
          @click="handleRemovePreset(preset)"
        >
          <frame-icon
            name="trash"
            small
          />
        </button>
      </div>
    </div>

    <div
      v-if="missing.length"
      class="m3-set__row"
    >
      <div class="m3-set__label">
        <b>{{ presets.length ? 'The usual ones' : 'No materials yet' }}</b>
        <span>{{ missing.map(m => m.name).join(', ') }}, at the temperatures the M1 prints them.</span>
      </div>
      <div class="m3-set__control">
        <button
          type="button"
          class="cbtn cbtn--primary"
          data-tid="material-add-usual"
          @click="addUsual"
        >
          Add {{ missing.length === 1 ? missing[0].name : 'them' }}
        </button>
      </div>
    </div>

    <preset-dialog
      v-if="dialogState.active"
      v-model="dialogState.active"
      :preset="dialogState.preset"
      @save="handleSavePreset"
    />
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PresetDialog from './PresetDialog.vue'
import type { TemperaturePreset } from '@/store/config/types'
import type { Fan, Heater } from '@/store/printer/types'
import StateMixin from '@/mixins/state'
import { PANEL_MATERIALS } from '@/services/control/model'

@Component({
  components: {
    PresetDialog
  }
})
export default class TemperaturePresetSettings extends Mixins(StateMixin) {
  get heaters (): Heater[] {
    return this.$store.getters['printer/getHeaters']
  }

  get fans (): Fan[] {
    return this.$store.getters['printer/getOutputs'](['temperature_fan'])
  }

  get presets () {
    return this.$store.getters['config/getTempPresets']
  }

  dialogState: any = {
    active: false,
    preset: null
  }

  openEditDialog (preset: TemperaturePreset) {
    this.dialogState = {
      active: true,
      preset
    }
  }

  openAddDialog () {
    const preset: any = {
      id: -1,
      name: '',
      values: {}
    }
    for (const item of this.heaters) {
      preset.values[item.name] = { value: 0, type: 'heater', active: true }
    }
    for (const item of this.fans) {
      preset.values[item.name] = { value: 0, type: 'fan', active: true }
    }
    this.dialogState = {
      active: true,
      preset
    }
  }

  handleSavePreset (preset: TemperaturePreset) {
    this.$store.dispatch('config/updatePreset', preset)
  }

  handleRemovePreset (preset: TemperaturePreset) {
    this.$store.dispatch('config/removePreset', preset)
  }

  /** The panel's swatch for a material of that name, else a neutral grey. */
  swatch (name: string): string {
    return PANEL_MATERIALS.find(p => p.name.toUpperCase() === name.trim().toUpperCase())?.colour ?? '#8a9597'
  }

  /** "215° nozzle · 60° bed · Part fan 30%". */
  describe (preset: TemperaturePreset): string {
    const parts: string[] = []
    for (const [name, v] of Object.entries(preset.values ?? {})) {
      if (!v.active || v.value <= 0) continue
      if (name === 'extruder') parts.push(`${v.value}° nozzle`)
      else if (name === 'heater_bed') parts.push(`${v.value}° bed`)
      else parts.push(`${name.replace(/^(temperature_fan|heater_generic) /, '')} ${v.value}${v.type === 'fan' ? '%' : '°'}`)
    }
    return parts.join(' · ') || 'No temperatures set'
  }

  /** U5's four, where the table doesn't have them. */
  get missing () {
    const names = new Set((this.presets as TemperaturePreset[]).map(p => p.name.trim().toUpperCase()))
    return PANEL_MATERIALS.filter(m => ['PLA', 'PETG', 'ABS', 'TPU'].includes(m.name) && !names.has(m.name))
  }

  addUsual () {
    for (const m of this.missing) {
      this.handleSavePreset({
        id: -1,
        name: m.name,
        values: {
          extruder: { value: m.nozzle, type: 'heater', active: true },
          heater_bed: { value: m.bed, type: 'heater', active: true }
        }
      } as unknown as TemperaturePreset)
    }
  }
}
</script>

<style lang="scss" scoped>
  .mat__head .m3-set__title {
    margin: 0;
  }

  .mat__swatch {
    flex: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 25%);
  }

  .mat__remove {
    display: inline-flex;
    padding: 8px;
    border-radius: 10px;
    color: var(--m3d-text-muted);

    &:hover {
      background: var(--m3d-hover);
      color: var(--m3d-danger);
    }
  }
</style>
