<template>
  <span
    class="tone-pill"
    :class="`tone-pill--${tone}`"
  >
    <span
      v-if="dot"
      class="tone-pill__dot"
    />
    <slot />
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { TileTone } from '@/services/printers-page/model'

/** A state in a word, in its colour: Ready, 42%, Paused, Offline. */
@Component({})
export default class TonePill extends Vue {
  @Prop({ type: String, default: 'off' })
  readonly tone!: TileTone

  @Prop({ type: Boolean, default: true })
  readonly dot!: boolean
}
</script>

<style lang="scss" scoped>
  .tone-pill {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 6px;
    height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .tone-pill__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  .tone-pill--ok { background: color-mix(in srgb, var(--m3d-success) 16%, transparent); color: var(--m3d-success); }
  .tone-pill--run { background: var(--m3d-accent-soft); color: var(--m3d-accent); }
  .tone-pill--warn { background: color-mix(in srgb, var(--m3d-warning) 16%, transparent); color: var(--m3d-warning); }
  .tone-pill--err { background: color-mix(in srgb, var(--m3d-danger) 16%, transparent); color: var(--m3d-danger); }
  .tone-pill--off { background: var(--m3d-surface-2); color: var(--m3d-text-muted); }
  .tone-pill--info { background: color-mix(in srgb, #6aa8ff 16%, transparent); color: #6aa8ff; }
</style>
