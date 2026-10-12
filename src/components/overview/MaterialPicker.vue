<template>
  <v-menu
    v-model="open"
    :close-on-content-click="false"
    offset-y
    :nudge-bottom="6"
    min-width="280"
    max-width="320"
    content-class="matp"
  >
    <template #activator="{ on, attrs }">
      <button
        type="button"
        class="ov-tile matp__tile"
        :class="{ 'matp__tile--phone': phone }"
        :disabled="!klippyReady"
        aria-haspopup="listbox"
        :aria-expanded="open ? 'true' : 'false'"
        data-tid="tile-filament"
        v-bind="attrs"
        v-on="on"
      >
        <span class="ov-tile__head">
          <span>Filament</span>
          <frame-icon
            name="spool"
            small
          />
        </span>
        <span class="ov-tile__value">
          <span
            v-if="loadedMaterial"
            class="matp__swatch"
            :style="{ background: loadedMaterial.colour }"
          />{{ loadedMaterial ? loadedMaterial.name : 'Not set' }}
        </span>
        <span class="ov-tile__sub">{{ subtitle }}</span>
      </button>
    </template>

    <div
      class="matp__panel"
      data-tid="material-picker"
    >
      <p class="matp__title">
        What's loaded?
      </p>
      <div
        role="listbox"
        aria-label="Material"
        class="matp__list"
      >
        <button
          v-for="m in materialChoices"
          :key="m.name"
          type="button"
          role="option"
          class="matp__row"
          :class="{ 'matp__row--on': loadedMaterial && loadedMaterial.name === m.name }"
          :aria-selected="loadedMaterial && loadedMaterial.name === m.name ? 'true' : 'false'"
          :disabled="printerPrinting"
          :data-tid="`material-${m.name}`"
          @click="choose(m)"
        >
          <span
            class="matp__swatch"
            :style="{ background: m.colour }"
          />
          <b>{{ m.name }}</b>
          <span class="matp__temps">{{ temps(m) }}</span>
          <frame-icon
            v-if="loadedMaterial && loadedMaterial.name === m.name"
            name="check"
            small
          />
        </button>
      </div>
      <p
        v-if="printerPrinting"
        class="matp__note"
      >
        Not while printing: the print was sliced for what's loaded.
      </p>
      <div
        v-if="loadedMaterial"
        class="matp__actions"
      >
        <button
          type="button"
          class="cbtn cbtn--primary"
          :disabled="!klippyReady || busy"
          data-tid="material-heat"
          @click="heat"
        >
          <frame-icon
            name="flame"
            small
          />
          Heat for {{ loadedMaterial.name }}
        </button>
        <button
          v-if="hasMacro('LOAD_FILAMENT')"
          type="button"
          class="cbtn"
          :disabled="!klippyReady || busy"
          @click="run('LOAD_FILAMENT')"
        >
          Load
        </button>
        <button
          v-if="hasMacro('UNLOAD_FILAMENT')"
          type="button"
          class="cbtn"
          :disabled="!klippyReady || busy"
          @click="run('UNLOAD_FILAMENT')"
        >
          Unload
        </button>
      </div>
      <router-link
        :to="presetsTo"
        class="matp__more"
        @click.native="open = false"
      >
        Change the materials' temperatures
      </router-link>
    </div>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import type { MaterialChoice } from '@/services/control/model'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'

/**
 * Overview's Filament tile, for everyone: what's loaded, and a press to
 * change it. The printer remembers it (save_variables muon_material, as the
 * panel does), so the panel, this page and the slicer agree. From here:
 * heat for it, and load or unload with the printer's own macros.
 */
@Component({})
export default class MaterialPicker extends Mixins(ControlMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  open = false

  get subtitle (): string {
    const m = this.loadedMaterial
    if (!m) return 'Tap to say what\'s loaded'
    return this.temps(m)
  }

  get presetsTo (): string {
    return `${scopedPath('/settings', activeSlug())}#presets`
  }

  temps (m: MaterialChoice): string {
    return [m.nozzle !== null ? `${m.nozzle}° nozzle` : '', m.bed !== null ? `${m.bed}° bed` : ''].filter(Boolean).join(' · ')
  }

  hasMacro (name: string): boolean {
    return `gcode_macro ${name.toLowerCase()}` in (this.$store.state.printer.printer.configfile?.settings ?? {})
  }

  choose (m: MaterialChoice) {
    if (this.printerPrinting) return
    this.setLoadedMaterial(m)
  }

  heat () {
    if (this.loadedMaterial) this.heatFor(this.loadedMaterial)
    this.open = false
  }

  run (macro: string) {
    this.sendGcode(macro)
    this.open = false
  }
}
</script>

<style lang="scss" scoped>
  .matp__tile {
    width: 100%;
    font: inherit;
    cursor: pointer;

    &:disabled {
      cursor: default;
      opacity: 0.6;
    }
  }

  .matp__tile--phone {
    grid-column: 1 / -1;
  }

  .matp__swatch {
    display: inline-block;
    flex: none;
    width: 12px;
    height: 12px;
    margin-right: 8px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 25%);
    vertical-align: middle;
  }

  .matp__panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--m3d-border);
    border-radius: 18px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .matp__title {
    margin: 0 4px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  .matp__list {
    display: flex;
    flex-direction: column;
  }

  .matp__row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 40px;
    padding: 0 8px;
    border-radius: 10px;
    color: var(--m3d-text);
    text-align: left;

    b {
      min-width: 52px;
      font-size: 14px;
    }

    &:hover:not(:disabled) {
      background: var(--m3d-hover);
    }

    &:disabled {
      opacity: 0.5;
    }
  }

  .matp__row--on {
    background: var(--m3d-surface-2);
  }

  .matp__temps {
    flex: 1 1 auto;
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .matp__note {
    margin: 0 4px;
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .matp__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    padding-top: 8px;
    border-top: 1px solid var(--m3d-border);

    > :first-child {
      grid-column: 1 / -1;
      justify-content: center;
    }

    > * {
      justify-content: center;
    }
  }

  .matp__more {
    margin: 2px 4px 0;
    color: var(--m3d-accent) !important;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }
</style>

<style lang="scss">
  .v-menu__content.matp {
    border-radius: 18px;
    box-shadow: 0 12px 40px rgb(0 0 0 / 35%);
  }
</style>
