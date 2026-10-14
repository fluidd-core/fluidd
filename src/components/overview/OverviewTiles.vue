<template>
  <div
    class="ov-tiles"
    :class="{ 'ov-tiles--phone': phone }"
    data-tid="overview-tiles"
  >
    <router-link
      v-for="tile in heaterTiles"
      :key="tile.id"
      :to="controlPath"
      class="ov-tile"
      :data-tid="`tile-${tile.id}`"
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
    </router-link>

    <!-- Printing: speed and the part fan. Idle: the filament and the lights. -->
    <template v-if="!phone">
      <div
        v-if="busy"
        class="ov-tile ov-tile--static"
        data-tid="tile-speed"
      >
        <span class="ov-tile__head">
          <span>Speed</span>
          <span class="ov-tile__state">{{ speedFactor }}%</span>
        </span>
        <seg-picker
          :options="speedOptions"
          :value="speedFactor"
          label="Speed"
          accent
          fill
          :disabled="!klippyReady"
          @input="setSpeed"
        />
      </div>
      <router-link
        v-else
        :to="controlPath"
        class="ov-tile"
        data-tid="tile-filament"
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
            v-if="material"
            class="ov-tile__swatch"
          />{{ material ? material.name : 'Not set' }}
        </span>
        <span class="ov-tile__sub">{{ material ? `${material.nozzle}° nozzle${material.bed !== null ? ` · ${material.bed}° bed` : ''}` : 'Pick a material in Control' }}</span>
      </router-link>

      <button
        v-if="!busy && hasLights"
        type="button"
        class="ov-tile"
        :disabled="!klippyReady"
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
      <router-link
        v-else-if="partFan"
        :to="controlPath"
        class="ov-tile"
        data-tid="tile-part-fan"
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
      </router-link>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { SPEED_PRESETS } from '@/services/control/model'
import type { HeaterTile } from '@/services/overview/model'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'

interface TileView {
  id: string;
  label: string;
  value: string;
  target: string;
  state: string;
  tone: string;
  bar: number | null;
}

/**
 * Four live tiles under the stage. Each opens Control: the nozzle and bed
 * with their targets; printing, the speed (set here) and the part fan;
 * idle, the material and the lights (switched here).
 */
@Component({ components: { SegPicker } })
export default class OverviewTiles extends Mixins(OverviewMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  get controlPath (): string {
    return this.pagePath('/control')
  }

  view (id: string, label: string, tile: HeaterTile | null): TileView | null {
    if (!tile) return null
    const deg = `${Math.round(tile.temperature)}°`
    if (tile.status === 'off') {
      return { id, label, value: deg, target: '', state: this.busy ? 'off' : 'Off · tap to heat', tone: 'off', bar: null }
    }
    return {
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
    return SPEED_PRESETS.map(p => ({ value: p.percent, label: p.label }))
  }
}
</script>

<style lang="scss" scoped>
  .ov-tiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .ov-tiles--phone {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .ov-tile {
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

  .ov-tile--static {
    gap: 10px;
  }

  .ov-tile__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .ov-tile__state {
    font-size: 12px;
    font-weight: 600;
  }

  .ov-tile__state--ok { color: var(--m3d-success); }
  .ov-tile__state--warn { color: var(--m3d-warning); }
  .ov-tile__state--off { color: var(--m3d-text-subtle); font-weight: 400; }

  .ov-tile__value {
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

  .ov-tile__swatch {
    align-self: center;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--m3d-warning);
  }

  .ov-tile__sub {
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }

  .ov-tile__bar {
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

  .ov-tile__bar--ok { background: var(--m3d-success); }
  .ov-tile__bar--warn { background: var(--m3d-warning); }
</style>
