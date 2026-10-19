<template>
  <control-card
    title="Filament"
    :locked="lockReason"
    :note="lockReason ? '' : note"
    data-tid="control-filament"
  >
    <template #aside>
      <span
        v-if="spoolLoaded"
        class="filament__loaded"
      >
        <span
          class="filament__swatch"
          :style="{ background: spoolLoaded.color }"
        />
        {{ spoolLoaded.text }}
      </span>
      <material-picker
        chip
      />
    </template>
    <div
      class="filament__buttons"
      :class="{ 'filament__buttons--phone': phone }"
    >
      <button
        v-if="changeMacro || !phone"
        type="button"
        class="cbtn cbtn--primary cbtn--grow"
        :disabled="!!lockReason || !changeMacro"
        :title="changeMacro ? '' : 'This printer has no filament change macro (M600)'"
        data-tid="change-filament"
        @click="run(changeMacro)"
      >
        Change filament
      </button>
      <button
        type="button"
        class="cbtn cbtn--grow"
        :disabled="!!lockReason || busy || !loadMacro"
        :title="loadMacro ? '' : 'This printer has no LOAD_FILAMENT macro'"
        data-tid="load-filament"
        @click="run(loadMacro)"
      >
        Load
      </button>
      <button
        type="button"
        class="cbtn cbtn--grow"
        :disabled="!!lockReason || busy || !unloadMacro"
        :title="unloadMacro ? '' : 'This printer has no UNLOAD_FILAMENT macro'"
        data-tid="unload-filament"
        @click="run(unloadMacro)"
      >
        Unload
      </button>
    </div>
    <p
      v-for="sensor in loaders"
      :key="sensor.name"
      class="filament__loader"
    >
      <template v-if="sensor.enabled">
        {{ sensor.filament_detected ? 'Filament in.' : 'No filament.' }} Push new filament in and it loads by itself. <b>Always on</b>
      </template>
      <template v-else>
        Automatic loading is off. Report the sensor state before loading filament.
      </template>
    </p>
    <div
      v-for="sensor in manualSensors"
      :key="sensor.name"
      class="crow"
    >
      <span class="crow__name">{{ sensor.prettyName }} · {{ !sensor.enabled ? 'off' : sensor.filament_detected ? 'filament in' : 'no filament' }}<span
        v-if="sensor.role === 'unknown'"
        class="crow__sub"
      > · settings not loaded</span></span>
      <toggle-switch
        :value="sensor.enabled"
        :label="`${sensor.prettyName} on`"
        :disabled="!controlReady || (sensor.enabled && sensor.role !== 'runout')"
        @input="setRunout(sensor.name, $event)"
      />
    </div>
    <control-task-fold
      v-if="hasExtruder"
      fold-key="filament.extrude"
      title="Extrude by hand"
      :summary="`${length} mm at ${speed} mm/s`"
    >
      <div
        v-if="hasExtruder"
        class="heat__extruder"
      >
        <div class="heat__extruder-head">
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
            @click="extrude(-1)"
          >
            Retract
          </button>
          <button
            type="button"
            class="cbtn cbtn--grow"
            :disabled="!canExtrude"
            data-tid="extrude"
            @click="extrude(1)"
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
    </control-task-fold>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import type { Macro } from '@/store/macros/types'
import type { Spool } from '@/store/spoolman/types'
import ControlCard from './ControlCard.vue'
import ControlTaskFold from './ControlTaskFold.vue'
import NumberField from './NumberField.vue'
import SegPicker, { type SegOption } from './SegPicker.vue'
import { extrudeBlocked, extrudeLengths, filamentSensorRole, sensorCommand, type FilamentSensorRole } from '@/services/control/model'
import type { RunoutSensor } from '@/store/printer/types'
import MaterialPicker from '@/components/overview/MaterialPicker.vue'
import ToggleSwitch from './ToggleSwitch.vue'

/** A macro, and whether it takes a temperature (TEMP=215). */
interface FilamentMacro {
  name: string;
  takesTemp: boolean;
}

/**
 * Filament: change it, load or unload it, through the printer's own
 * macros (M600, LOAD_FILAMENT, UNLOAD_FILAMENT), which heat the nozzle,
 * say when to pull and push, and purge. A macro that takes a TEMP is told
 * the material's nozzle heat.
 */
@Component({ components: { ControlCard, MaterialPicker, ControlTaskFold, NumberField, SegPicker, ToggleSwitch } })
export default class ControlFilament extends Mixins(ControlMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  lengthDraft: number | null = null
  speedDraft: number | null = null
  extrusionTarget = ''
  created () { this.resetExtrusion() }

  @Watch('panelTarget')
  resetExtrusion () { this.lengthDraft = null; this.speedDraft = null; this.extrusionTarget = this.panelTarget }

  get length (): number { return this.lengthDraft ?? (this.$store.state.config.uiSettings.general.defaultExtrudeLength as number || 10) }
  set length (value: number) { this.lengthDraft = value }
  get speed (): number { return this.speedDraft ?? (this.$store.state.config.uiSettings.general.defaultExtrudeSpeed as number || 5) }
  set speed (value: number) { this.speedDraft = value }

  get ready (): boolean { return this.controlReady }

  get loaders (): RunoutSensor[] {
    return ((this.$store.getters['printer/getRunoutSensors'] as RunoutSensor[]) ?? [])
      .filter(s => filamentSensorRole(this.$store.state.printer.printer.configfile, s.name) === 'loads')
  }

  get manualSensors (): Array<RunoutSensor & { prettyName: string; role: FilamentSensorRole }> {
    return ((this.$store.getters['printer/getRunoutSensors'] as Array<RunoutSensor & { prettyName: string }>) ?? [])
      .map(sensor => ({ ...sensor, role: filamentSensorRole(this.$store.state.printer.printer.configfile, sensor.name) }))
      .filter(sensor => sensor.role !== 'loads')
  }

  setRunout (name: string, enabled: boolean) {
    if (!this.controlReady) return
    const command = sensorCommand(name, enabled, this.$store.state.printer.printer.configfile)
    if (command) this.sendGcode(command)
  }

  extrude (direction: 1 | -1) {
    if (this.extrusionTarget !== this.panelTarget || !this.canExtrude || !Number.isFinite(this.length) || this.length <= 0 || this.length > this.maxExtrudeLength ||
      !Number.isFinite(this.speed) || this.speed < 0.1 || this.speed > this.maxExtrudeSpeed) return
    this.sendExtrudeGcode(direction * this.length, this.speed)
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
    if (this.activeExtruder?.can_extrude === false) return 'Heat the nozzle first; Klipper is not allowing extrusion yet.'
    return extrudeBlocked(this.activeExtruder?.temperature ?? 0, this.minExtrude, this.activeExtruder?.can_extrude)
  }

  get canExtrude (): boolean {
    return this.ready && !this.extrudeReason
  }

  get macros (): Macro[] {
    return ((this.$store.getters['macros/getMacros'] as Macro[]) ?? []).filter(m => typeof m.name === 'string')
  }

  find (...names: string[]): FilamentMacro | null {
    const macro = this.macros.find(m => names.includes(m.name.toLowerCase()))
    if (!macro) return null
    const gcode = String(macro.config?.gcode ?? '')
    return { name: macro.name.toUpperCase(), takesTemp: /params\.temp\b/i.test(gcode) }
  }

  get changeMacro (): FilamentMacro | null {
    return this.find('m600', 'change_filament', 'filament_change')
  }

  get loadMacro (): FilamentMacro | null {
    return this.find('load_filament', 'filament_load')
  }

  get unloadMacro (): FilamentMacro | null {
    return this.find('unload_filament', 'filament_unload')
  }

  get lockReason (): string {
    // Changing filament mid-print is what M600 is for; it pauses the print.
    return this.controlLock
  }

  get note (): string {
    return this.changeMacro
      ? 'Guided: it heats the nozzle for you, tells you when to pull and push, then purges.'
      : 'Load and unload heat the nozzle for you first.'
  }

  /**
   * Spool information is a fallback when no loaded record has been saved.
   * The picker stays available to set the printer's material and colour.
   */
  get spoolLoaded (): { text: string, color: string } | null {
    if (this.loadedMaterial) return null
    const spool = this.$store.getters['spoolman/getActiveSpool'] as Spool | null
    if (!spool?.filament) return null
    const f = spool.filament
    const parts = [f.material, f.name].filter(Boolean)
    if (spool.remaining_weight != null) parts.push(`about ${Math.round(spool.remaining_weight)} g left`)
    return { text: parts.join(' · '), color: f.color_hex ? `#${f.color_hex.replace(/^#/, '')}` : 'var(--m3d-text-muted)' }
  }

  /** Load and unload heat for the material the heaters are set to, else for what's loaded. */
  run (macro: FilamentMacro | null) {
    if (!macro || !this.controlReady || (this.busy && macro.name !== this.changeMacro?.name)) return
    const temp = this.material?.nozzle ?? this.loadedMaterial?.nozzle ?? null
    this.sendGcode(macro.takesTemp && temp ? `${macro.name} TEMP=${temp}` : macro.name)
  }
}
</script>

<style lang="scss" scoped>
  .heat__extruder { display: flex; flex-direction: column; gap: 8px; }
  .heat__extruder-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; }
  .heat__extruder-head h3 { margin: 0; font-size: 15px; }
  .heat__extruder-head span, .heat__reason { color: var(--m3d-text-subtle); font-size: 12px; }
  .heat__extrude-buttons { display: flex; gap: 8px; }
  .filament__loader { margin: 0; font-size: 13px; color: var(--m3d-text-muted); }
  .filament__loaded {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--m3d-text);
    font-size: 13px;
    white-space: nowrap;
  }

  .filament__swatch {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .filament__buttons {
    display: flex;
    gap: 8px;
  }

  .filament__buttons .cbtn--primary {
    flex-grow: 2;
  }

  .filament__buttons--phone .cbtn {
    height: 48px;
  }
</style>
