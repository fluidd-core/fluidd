<template>
  <div
    class="ov-tiles"
    :class="{ 'ov-tiles--phone': phone }"
    data-tid="overview-tiles"
  >
    <section
      v-for="tile in heaterTiles"
      :key="tile.context + tile.id"
      class="ov-tile"
      :data-tid="`tile-${tile.id}`"
    >
      <button
        type="button"
        class="ov-tile__door"
        :aria-expanded="openTile === tile.id ? 'true' : 'false'"
        :aria-controls="tileControlsId(tile.id)"
        @click="openTile = openTile === tile.id ? null : tile.id"
      >
        <span class="ov-tile__head">
          <span>{{ tile.label }}</span>
          <span
            class="ov-tile__state"
            :class="`ov-tile__state--${tile.tone}`"
          >{{ tile.state }}</span>
        </span>
        <span class="ov-tile__value">
          {{ tile.value }}<small v-if="tile.target"> / {{ tile.target }}</small>
        </span>
        <span
          v-if="tile.bar !== null"
          class="ov-tile__bar"
        ><i
          :class="`ov-tile__bar--${tile.tone}`"
          :style="{ width: `${tile.bar * 100}%` }"
        /></span>
      </button>
      <number-field
        v-if="openTile === tile.id"
        :id="tileControlsId(tile.id)"
        :value="targetFor(tile.id)"
        unit="°"
        :label="`${tile.label} target`"
        :min="0"
        :max="limitFor(tile.id)"
        :disabled="!controlReady"
        @change="commitTarget(tile.context, heaterFor(tile.id), $event)"
      />
    </section>

    <!-- Printing: speed and the part fan. Idle: the filament and the lights. -->
    <material-picker
      v-if="phone && !busy"
      phone
    />
    <template v-if="!phone || busy">
      <div
        v-if="busy"
        class="ov-tile ov-tile--static"
        data-tid="tile-speed"
      >
        <span class="ov-tile__head">
          <span>Speed</span>
          <span class="ov-tile__state">{{ speedLabel }}<template v-if="speedLabel !== `${speedFactor}%`"> · {{ speedFactor }}%</template></span>
        </span>
        <seg-picker
          :options="speedOptions"
          :value="speedFactor"
          label="Speed"
          accent
          fill
          :disabled="!controlReady"
          @input="setSpeed"
        />
        <number-field
          v-for="context in [panelTarget]"
          :key="context"
          :value="speedFactor"
          label="Custom speed"
          unit="%"
          :min="1"
          :max="500"
          :disabled="!controlReady"
          @change="commitSpeed(context, $event)"
        />
      </div>
      <material-picker v-else />

      <button
        v-if="!busy && hasLights"
        type="button"
        class="ov-tile"
        :disabled="!controlReady"
        data-tid="tile-lights"
        @click="setLights(lightsValue === 0)"
      >
        <span class="ov-tile__head">
          <span>Lights</span>
          <frame-icon
            name="bulb"
            small
          />
        </span>
        <span class="ov-tile__value">{{ lightsValue > 0 ? 'On' : 'Off' }}</span>
        <span class="ov-tile__sub">Tap to turn {{ lightsValue > 0 ? 'off' : 'on' }}</span>
      </button>
      <section
        v-else-if="partFan"
        class="ov-tile"
        data-tid="tile-part-fan"
      >
        <button
          type="button"
          class="ov-tile__door"
          :aria-expanded="openTile === 'fan' ? 'true' : 'false'"
          :aria-controls="tileControlsId('fan')"
          @click="openTile = openTile === 'fan' ? null : 'fan'"
        >
          <span class="ov-tile__head">
            <span>Part fan</span>
            <frame-icon
              name="fan"
              small
            />
          </span>
          <span class="ov-tile__value">{{ fanValue(partFan) }}%</span>
          <span class="ov-tile__sub">{{ busy ? 'Set by the print' : fanValue(partFan) ? 'On' : 'Off' }}</span>
        </button>
        <template v-if="openTile === 'fan'">
          <number-field
            v-for="context in [panelTarget]"
            :id="tileControlsId('fan')"
            :key="context"
            :value="fanValue(partFan)"
            label="Part fan"
            unit="%"
            :min="0"
            :max="100"
            :disabled="!controlReady"
            @change="commitFan(context, partFan, $event)"
          />
        </template>
      </section>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import type { Heater, Fan } from '@/store/printer/types'
import type { HeaterTile } from '@/services/overview/model'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import MaterialPicker from './MaterialPicker.vue'
import NumberField from '@/components/control/NumberField.vue'

interface TileView {
  context: string;
  id: string;
  label: string;
  value: string;
  target: string;
  state: string;
  tone: string;
  bar: number | null;
}

/**
 * Four live tiles under the stage: the nozzle and bed with their targets
 * (each opens Control); printing, the speed (set here) and the part fan;
 * idle, what's loaded (changed here, phones too) and the lights (switched
 * here).
 */
@Component({ components: { SegPicker, MaterialPicker, NumberField } })
export default class OverviewTiles extends Mixins(OverviewMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  openTile: string | null = null
  @Watch('panelTarget')
  resetTile () { this.openTile = null }

  // Each keyed field captures its render target, including detached callbacks.
  commitTarget (context: string, heater: Heater | null, value: number) { if (context === this.panelTarget) this.setHeater(heater, value) }
  commitSpeed (context: string, value: number) { if (context === this.panelTarget) this.setSpeed(value) }
  commitFan (context: string, fan: Fan, value: number) { if (context === this.panelTarget) this.setFan(fan, value) }

  heaterFor (id: string) { return id === 'nozzle' ? this.nozzle : this.bed }
  targetFor (id: string): number { return this.heaterFor(id)?.target ?? 0 }
  limitFor (id: string): number { return this.heaterFor(id)?.maxTemp ?? 300 }
  tileControlsId (id: string): string { return `overview-${id}-exact-value` }

  view (id: string, label: string, tile: HeaterTile | null): TileView | null {
    if (!tile) return null
    const deg = `${Math.round(tile.temperature)}°`
    if (tile.status === 'off') {
      return { context: this.panelTarget, id, label, value: deg, target: '', state: this.busy ? 'off' : 'Off · tap to heat', tone: 'off', bar: null }
    }
    return {
      context: this.panelTarget,
      id,
      label,
      value: deg,
      target: String(Math.round(tile.target)),
      state: tile.status,
      tone: tile.status === 'at temperature' ? 'ok' : 'warn',
      bar: tile.progress
    }
  }

  get heaterTiles (): TileView[] {
    return [this.view('nozzle', 'Nozzle', this.nozzleTile), this.view('bed', 'Bed', this.bedTile)].filter((t): t is TileView => !!t)
  }

  get speedOptions (): SegOption[] {
    return this.speedChoices.map(c => ({ value: c.percent, label: c.label }))
  }
}
</script>

<style lang="scss" scoped>
.ov-tile__door { display: flex; flex-direction: column; gap: 4px; width: 100%; text-align: left; color: inherit; }
  .ov-tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .ov-tiles--phone {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .ov-tiles :deep(.ov-tile) {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    padding: 14px 16px;
    border-radius: 18px;
    background: var(--m3d-surface);
    color: var(--m3d-text) !important;
    text-align: left;
    text-decoration: none;
    transition: box-shadow var(--m3d-duration-fast) var(--m3d-ease);

    &:hover:not(.ov-tile--static) {
      box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
    }
  }

  .ov-tiles :deep(.ov-tile--static) {
    gap: 10px;
  }

  .ov-tiles :deep(.ov-tile__head) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .ov-tiles :deep(.ov-tile__state) {
    font-size: 12px;
    font-weight: 600;
  }

  .ov-tiles :deep(.ov-tile__state--ok) { color: var(--m3d-success); }
  .ov-tiles :deep(.ov-tile__state--warn) { color: var(--m3d-warning); }
  .ov-tiles :deep(.ov-tile__state--off) { color: var(--m3d-text-subtle); font-weight: 400; }

  .ov-tiles :deep(.ov-tile__value) {
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 26px;
    font-weight: 600;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;

    small {
      color: var(--m3d-text-muted);
      font-size: 15px;
      font-weight: 500;
    }
  }

  .ov-tiles :deep(.ov-tile__swatch) {
    align-self: center;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--m3d-warning);
  }

  .ov-tiles :deep(.ov-tile__sub) {
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }

  .ov-tiles :deep(.ov-tile__bar) {
    height: 4px;
    margin-top: 6px;
    overflow: hidden;
    border-radius: 2px;
    background: var(--m3d-surface-2);

    i {
      display: block;
      height: 100%;
      border-radius: 2px;
      transition: width var(--m3d-duration-base) var(--m3d-ease);
    }
  }

  .ov-tiles :deep(.ov-tile__bar--ok) { background: var(--m3d-success); }
  .ov-tiles :deep(.ov-tile__bar--warn) { background: var(--m3d-warning); }
</style>
