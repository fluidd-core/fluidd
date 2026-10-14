<template>
  <div
    class="muon-card"
    :class="{ 'is-active': !!entry.active, 'is-dim': dim }"
    role="button"
    tabindex="0"
    :data-health="entry.health"
    @click="$emit('open')"
    @keydown.enter.self="$emit('open')"
  >
    <printer-thumb
      :size="40"
      :state="thumbState"
    />
    <span class="muon-card__text">
      <span class="muon-card__title">
        <span class="muon-card__name">{{ parts.name }}</span>
        <span
          v-if="parts.suffix"
          class="muon-card__suffix"
        >{{ parts.suffix }}</span>
        <span
          v-if="entry.active"
          class="muon-card__badge"
        >{{ entry.active === 'cloud' ? 'Open, remote' : 'Open' }}</span>
      </span>
      <span
        class="muon-card__detail"
        :class="`is-${entry.health}`"
        :title="statusTitle"
      >
        <v-progress-circular
          v-if="busy || spinning"
          indeterminate
          size="11"
          width="2"
          class="muon-card__spinner"
        />
        <v-icon
          v-if="entry.nearby"
          x-small
          class="muon-card__meta-icon"
        >
          $bluetooth
        </v-icon>
        <span class="muon-card__detail-text">{{ entry.detail }}</span>
      </span>
      <span
        v-if="note"
        class="muon-card__note"
      >
        {{ note }}
      </span>
      <slot />
    </span>
    <v-menu
      v-if="actions.length"
      left
      offset-y
    >
      <template #activator="{ on, attrs }">
        <button
          type="button"
          class="muon-card__menu"
          :aria-label="`Options for ${entry.name}`"
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
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { healthLabel, type CardAction, type DirectoryEntry } from '@/services/muon-cloud/directory'
import { printerNameParts, type PrinterNameParts } from '@/util/printer-name'
import type { ThumbState } from '@/components/ui/PrinterThumb.vue'

export type { CardAction } from '@/services/muon-cloud/directory'

/**
 * One printer in the switcher: its picture, its name, and how it is now,
 * coloured: green when it answered and Klipper is ready, teal printing, a
 * spinner while it is being reached, grey when nothing answers, red when it
 * answered with a fault, amber when it wants access. What can be done with
 * the printer is in its own menu.
 */
@Component({})
export default class PrinterCard extends Vue {
  @Prop({ type: Object, required: true })
  readonly entry!: DirectoryEntry

  @Prop({ type: Array, default: () => [] })
  readonly actions!: CardAction[]

  /** This card's printer is being opened now. */
  @Prop({ type: Boolean, default: false })
  readonly busy!: boolean

  @Prop({ type: String, default: '' })
  readonly note!: string

  get spinning () {
    return this.entry.health === 'connecting' || this.entry.health === 'searching'
  }

  get dim () {
    return this.entry.health === 'offline' && !this.entry.active
  }

  get statusTitle () {
    return healthLabel(this.entry.health)
  }

  get parts (): PrinterNameParts {
    return printerNameParts(this.entry.name)
  }

  get thumbState (): ThumbState {
    if (this.entry.health === 'printing' || this.entry.health === 'paused') return 'printing'
    if (this.entry.health === 'offline') return 'offline'
    return 'idle'
  }
}
</script>

<style lang="scss" scoped>
.muon-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 14px;
  color: var(--m3d-text);
  cursor: pointer;
  transition: background-color var(--m3d-duration-fast) var(--m3d-ease);

  &:hover,
  &:focus-visible {
    background: var(--m3d-hover);
    outline: none;
  }

  &.is-active {
    background: var(--m3d-surface-2);
  }

  &.is-dim {
    opacity: 0.7;
  }

  &__text {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__name {
    overflow: hidden;
    font-size: 15px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__suffix {
    flex: none;
    color: var(--m3d-text-subtle);
    font-family: var(--m3d-font-mono);
    font-size: 12px;
  }

  &__badge {
    flex: none;
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
    font-size: 11px;
    font-weight: 600;
  }

  &__detail {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;

    &.is-online { color: var(--m3d-success); }
    &.is-printing { color: var(--m3d-accent); }
    &.is-paused,
    &.is-locked { color: var(--m3d-warning); }
    &.is-error { color: var(--m3d-danger); }
    &.is-offline,
    &.is-available { color: var(--m3d-text-subtle); }
  }

  &__detail-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__spinner {
    flex: none;
  }

  &__note {
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  &__meta-icon {
    color: inherit !important;
  }

  &__menu {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: var(--m3d-text-muted);

    &:hover {
      background: var(--m3d-hover);
      color: var(--m3d-text);
    }
  }
}
</style>
