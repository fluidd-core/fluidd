<template>
  <div
    class="found"
    :data-tid="`found-${tile.key}`"
  >
    <printer-stage
      :state="tile.state === 'printing' ? 'printing' : 'idle'"
      :height="stageHeight"
      class="found__stage"
    />
    <div class="found__body">
      <div class="found__title">
        <div class="found__names">
          <span class="found__name">{{ tile.name }}</span>
          <span
            v-if="host"
            class="found__host"
          >{{ host }}</span>
        </div>
        <tone-pill :tone="tile.tone">
          {{ tile.label }}
        </tone-pill>
      </div>
      <span class="found__about">{{ about }}</span>
      <div class="found__actions">
        <button
          v-if="primary"
          type="button"
          class="found__btn found__btn--primary"
          :disabled="busy || primary.disabled"
          :data-tid="`found-${primary.id}`"
          @click="$emit('action', primary.id)"
        >
          <v-progress-circular
            v-if="busy"
            indeterminate
            size="14"
            width="2"
          />
          {{ primary.label }}
        </button>
        <button
          v-for="a in secondary"
          :key="a.id"
          type="button"
          class="found__btn"
          :disabled="a.disabled"
          :data-tid="`found-${a.id}`"
          @click="$emit('action', a.id)"
        >
          {{ a.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { CardAction } from '@/services/muon-cloud/directory'
import type { PrinterTile } from '@/services/printers-page/model'
import PrinterStage from './PrinterStage.vue'
import TonePill from './TonePill.vue'

/**
 * A printer found on this network that is not yours yet, shown large
 * whether or not you're signed in: what it is, and the one thing to do
 * with it (open it, set it up, or ask for access).
 */
@Component({ components: { PrinterStage, TonePill } })
export default class FoundPrinterCard extends Vue {
  @Prop({ type: Object, required: true })
  readonly tile!: PrinterTile

  @Prop({ type: Array, default: () => [] })
  readonly actions!: CardAction[]

  @Prop({ type: Boolean })
  readonly busy?: boolean

  @Prop({ type: Number, default: 300 })
  readonly stageHeight!: number

  get host (): string | null {
    return this.tile.entry.lan?.host ?? this.tile.entry.host
  }

  /** Open first, then Set it up; linking and asking follow. */
  get primary (): CardAction | null {
    if (this.tile.state === 'new') return { id: 'set-up', label: 'Set it up', icon: '' }
    if (this.tile.entry.row?.action === 'nearby-info') return { id: 'nearby-info', label: 'What is this?', icon: '' }
    const open = this.actions.find(a => a.id === 'connect')
    return open ? { ...open, label: 'Open' } : null
  }

  get secondary (): CardAction[] {
    return this.actions.filter(a => a.id !== 'connect')
  }

  get about (): string {
    if (this.tile.state === 'new') return 'Not set up yet. Setup takes a few minutes: Wi-Fi, a name and a test print.'
    if (this.tile.entry.linkedTo === 'other') {
      return 'Linked to another account. You can use it on this network, or ask its owner to share it so it follows you anywhere.'
    }
    if (this.tile.state === 'locked') return 'It wants to know who you are before it lets this browser in.'
    return this.tile.entry.detail
  }
}
</script>

<style lang="scss" scoped>
  .found {
    display: flex;
    flex-direction: column;
    min-width: 0;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .found__stage {
    margin: 10px 10px 0;
  }

  .found__body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px 20px;
  }

  .found__title {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .found__names {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .found__name {
    overflow: hidden;
    font-size: 22px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .found__host {
    overflow: hidden;
    color: var(--m3d-text-subtle);
    font-family: var(--m3d-font-mono);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .found__about {
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .found__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
  }

  .found__btn {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 40px;
    padding: 0 16px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }

    &:hover:not(:disabled) {
      filter: brightness(1.12);
    }
  }

  .found__btn--primary {
    flex: 1 1 auto;
    background: var(--m3d-accent);
    color: var(--m3d-on-accent, #00201e);
  }
</style>
