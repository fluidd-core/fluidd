<template>
  <div
    class="tile"
    :class="[`tile--${variant}`, { 'tile--needs': needs, 'tile--printing': tile.state === 'printing', 'tile--busy': busy }]"
    role="button"
    tabindex="0"
    :draggable="draggable ? 'true' : 'false'"
    :data-tid="`printer-tile-${tile.key}`"
    @click="$emit('open')"
    @keydown.enter.self="$emit('open')"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend')"
  >
    <printer-stage
      v-if="variant === 'card'"
      :state="thumbState"
      :height="stageHeight"
      class="tile__stage"
    />
    <printer-thumb
      v-else
      :size="variant === 'row' ? 44 : 48"
      :state="thumbState"
    />

    <div class="tile__text">
      <div class="tile__title">
        <span class="tile__name">{{ tile.name }}</span>
        <tone-pill
          v-if="variant === 'card'"
          :tone="tile.tone"
        >
          {{ tile.label }}
        </tone-pill>
      </div>
      <span
        class="tile__detail"
        :class="`tile__detail--${detailTone}`"
      >
        <frame-icon
          v-if="tile.remote"
          name="cloud"
          small
        />
        <v-progress-circular
          v-if="busy"
          indeterminate
          size="11"
          width="2"
        />
        {{ detailText }}
      </span>
    </div>

    <v-menu
      v-if="actions.length"
      left
      offset-y
    >
      <template #activator="{ on, attrs }">
        <button
          type="button"
          class="tile__menu"
          :aria-label="`Options for ${tile.name}`"
          v-bind="attrs"
          @click.stop
          v-on="on"
        >
          <frame-icon name="more" />
        </button>
      </template>
      <v-list dense>
        <v-list-item
          v-for="a in actions"
          :key="a.id"
          :disabled="a.disabled"
          :data-action="a.id"
          @click="$emit('action', a.id)"
        >
          <v-list-item-icon class="mr-3">
            <v-icon
              small
              :color="a.danger ? 'error' : undefined"
            >
              {{ a.icon }}
            </v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title :class="{ 'error--text': a.danger }">
              {{ a.label }}
            </v-list-item-title>
            <v-list-item-subtitle v-if="a.hint">
              {{ a.hint }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>
    <frame-icon
      v-else-if="variant === 'row'"
      name="chevronRight"
      small
      class="tile__chevron"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { CardAction } from '@/services/muon-cloud/directory'
import { needsYou, type PrinterTile, type TileTone } from '@/services/printers-page/model'
import type { ThumbState } from '@/components/ui/PrinterThumb.vue'
import PrinterStage from './PrinterStage.vue'
import TonePill from './TonePill.vue'

/**
 * One printer in a group: a card with the whole M1, a small card when
 * several are printing and room is short, or a row on a phone.
 */
@Component({ components: { PrinterStage, TonePill } })
export default class PrinterTileCard extends Vue {
  @Prop({ type: Object, required: true })
  readonly tile!: PrinterTile

  @Prop({ type: String, default: 'card' })
  readonly variant!: 'card' | 'compact' | 'row'

  @Prop({ type: Array, default: () => [] })
  readonly actions!: CardAction[]

  @Prop({ type: Boolean })
  readonly busy?: boolean

  @Prop({ type: Boolean })
  readonly draggable?: boolean

  /** It is printing, and shown larger above. */
  @Prop({ type: Boolean })
  readonly shownAbove?: boolean

  @Prop({ type: Number, default: 236 })
  readonly stageHeight!: number

  get needs (): boolean {
    return needsYou(this.tile.state)
  }

  get thumbState (): ThumbState {
    if (this.tile.state === 'printing' || this.tile.state === 'paused') return 'printing'
    if (this.tile.state === 'offline') return 'offline'
    return 'idle'
  }

  get detailText (): string {
    if (this.variant !== 'card') {
      if (this.tile.state === 'printing') return this.tile.label === 'Printing' ? 'Printing' : `Printing · ${this.tile.label}`
      return this.tile.state === 'ready' ? `Ready · ${this.tile.detail}` : this.tile.detail
    }
    return this.shownAbove ? 'Printing · shown above' : this.tile.detail
  }

  get detailTone (): TileTone | 'muted' {
    if (this.tile.state === 'ready' && this.variant === 'card') return 'muted'
    return this.tile.tone
  }
}
</script>

<style lang="scss" scoped>
  .tile {
    position: relative;
    display: flex;
    min-width: 0;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    cursor: pointer;
    transition: box-shadow var(--m3d-duration-fast) var(--m3d-ease), transform var(--m3d-duration-fast) var(--m3d-ease);

    &:hover,
    &:focus-visible {
      box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
      outline: none;
    }
  }

  .tile--needs {
    box-shadow: inset 0 0 0 1.5px var(--m3d-warning) !important;
  }

  .tile--printing {
    box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--m3d-accent) 32%, transparent);
  }

  .tile--busy {
    opacity: 0.8;
  }

  .tile--card {
    flex-direction: column;

    .tile__stage {
      margin: 8px 8px 0;
    }

    .tile__text {
      gap: 6px;
      padding: 12px 16px 16px;
    }

    .tile__name {
      font-size: 17px;
    }

    .tile__menu {
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgb(255 255 255 / 70%);
      color: #3a3a3c;
      opacity: 0;
    }

    &:hover .tile__menu,
    &:focus-within .tile__menu {
      opacity: 1;
    }
  }

  @media (hover: none) {
    .tile--card .tile__menu {
      opacity: 1;
    }
  }

  .tile--compact,
  .tile--row {
    align-items: center;
    gap: 10px;
    padding: 10px;
  }

  .tile--compact {
    border-radius: 18px;
  }

  // A row in a list says its state in its colour; an outline per row would
  // box each one off from the list.
  .tile--row {
    gap: 12px;
    min-height: 60px;
    padding: 8px 12px 8px 8px;
    border-radius: 0;
    background: transparent;
    box-shadow: none !important;

    &:hover,
    &:focus-visible {
      background: var(--m3d-hover);
    }
  }

  .tile__text {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .tile__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }

  .tile__name {
    overflow: hidden;
    font-size: 15px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tile__detail {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tile--compact .tile__detail {
    font-size: 12px;
  }

  .tile__detail--muted,
  .tile__detail--off { color: var(--m3d-text-muted); }
  .tile__detail--ok { color: var(--m3d-success); }
  .tile__detail--run { color: var(--m3d-accent); }
  .tile__detail--warn { color: var(--m3d-warning); }
  .tile__detail--err { color: var(--m3d-danger); }
  .tile__detail--info { color: #6aa8ff; }

  .tile__menu {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: var(--m3d-text-muted);
    transition: opacity var(--m3d-duration-fast) var(--m3d-ease);

    &:hover {
      background: var(--m3d-hover);
    }
  }

  .tile__chevron {
    color: var(--m3d-text-subtle);
  }
</style>
