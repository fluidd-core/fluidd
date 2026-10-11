<template>
  <div
    class="conn-bar"
    :class="`conn-bar--${kind}`"
    role="status"
    aria-live="polite"
    :data-tid="`connection-${kind}`"
  >
    <span
      v-if="kind === 'quiet'"
      class="conn-bar__dot"
    />
    <frame-icon
      v-else
      name="wifi"
      class="conn-bar__icon"
    />
    <div class="conn-bar__text">
      <strong>{{ title }}</strong>
      <span>{{ detail }}</span>
    </div>
    <button
      v-if="kind === 'reconnecting' && !trying"
      type="button"
      class="cbtn conn-bar__btn"
      data-tid="connection-try-now"
      @click="tryNow"
    >
      Try now
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import ReconnectMixin from '@/mixins/reconnect'
import { retryIn } from '@/services/connection/view'

/**
 * Over a page whose printer has gone quiet or dropped (the concept sheet's
 * States board): it says so and keeps trying, and the page underneath
 * keeps its last view instead of being torn down.
 */
@Component({})
export default class ConnectionBanner extends Mixins(ReconnectMixin) {
  @Prop({ type: String, required: true })
  readonly kind!: 'reconnecting' | 'quiet'

  /** A try is running now, rather than waiting its turn. */
  get trying (): boolean {
    return this.socketConnecting && !this.retryPending
  }

  get title (): string {
    if (this.kind === 'quiet') return `No word from ${this.printerName} for a few seconds`
    return `Lost touch with ${this.printerName}`
  }

  get detail (): string {
    if (this.kind === 'quiet') return 'Probably a slow network. Nothing is lost.'
    const wait = this.retryInMs
    const when = this.trying ? 'Trying again now.' : wait !== null ? `Trying again in ${retryIn(wait)}.` : 'Not trying.'
    return `${when} The page keeps its last view.`
  }
}
</script>

<style lang="scss" scoped>
  .conn-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 16px;
    padding: 10px 12px 10px 16px;
    border-radius: 16px;
    color: var(--m3d-text);
  }

  .conn-bar--reconnecting {
    background: color-mix(in srgb, var(--m3d-warning) 16%, var(--m3d-surface));
  }

  .conn-bar--quiet {
    background: var(--m3d-surface);
  }

  .conn-bar__icon {
    flex: none;
    color: var(--m3d-warning);
  }

  .conn-bar__dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--m3d-warning);
  }

  .conn-bar__text {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: wrap;
    gap: 2px 10px;
    min-width: 0;
    font-size: 14px;

    span {
      color: var(--m3d-text-muted);
    }
  }

  .conn-bar__btn {
    height: 34px;
  }
</style>
