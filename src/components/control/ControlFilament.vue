<template>
  <control-card
    title="Filament"
    :locked="lockReason"
    :note="lockReason ? '' : note"
    data-tid="control-filament"
  >
    <template #aside>
      <span
        v-if="loaded"
        class="filament__loaded"
      >
        <span
          class="filament__swatch"
          :style="{ background: loaded.color }"
        />
        {{ loaded.text }}
      </span>
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
      <template v-if="!phone || !changeMacro">
        <button
          type="button"
          class="cbtn cbtn--grow"
          :disabled="!!lockReason || printerPrinting || !loadMacro"
          :title="loadMacro ? '' : 'This printer has no LOAD_FILAMENT macro'"
          data-tid="load-filament"
          @click="run(loadMacro)"
        >
          Load
        </button>
        <button
          type="button"
          class="cbtn cbtn--grow"
          :disabled="!!lockReason || printerPrinting || !unloadMacro"
          :title="unloadMacro ? '' : 'This printer has no UNLOAD_FILAMENT macro'"
          data-tid="unload-filament"
          @click="run(unloadMacro)"
        >
          Unload
        </button>
      </template>
    </div>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import type { Macro } from '@/store/macros/types'
import type { Spool } from '@/store/spoolman/types'
import ControlCard from './ControlCard.vue'

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
@Component({ components: { ControlCard } })
export default class ControlFilament extends Mixins(ControlMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

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
    return this.klippyReady ? '' : 'Klipper is not ready'
  }

  get note (): string {
    return this.changeMacro
      ? 'Guided: it heats the nozzle for you, tells you when to pull and push, then purges.'
      : 'Load and unload heat the nozzle for you first.'
  }

  /** What is loaded: the spool from Spoolman, else the material the heaters are set to. */
  get loaded (): { text: string, color: string } | null {
    const spool = this.$store.getters['spoolman/getActiveSpool'] as Spool | null
    if (spool?.filament) {
      const f = spool.filament
      const parts = [f.material, f.name].filter(Boolean)
      if (spool.remaining_weight != null) parts.push(`about ${Math.round(spool.remaining_weight)} g left`)
      return { text: parts.join(' · '), color: f.color_hex ? `#${f.color_hex.replace(/^#/, '')}` : 'var(--m3d-text-muted)' }
    }
    return this.material ? { text: `${this.material.name} heat set`, color: 'var(--m3d-warning)' } : null
  }

  run (macro: FilamentMacro | null) {
    if (!macro) return
    const temp = this.material?.nozzle ?? null
    this.sendGcode(macro.takesTemp && temp ? `${macro.name} TEMP=${temp}` : macro.name)
  }
}
</script>

<style lang="scss" scoped>
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
