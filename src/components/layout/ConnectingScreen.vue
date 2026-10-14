<template>
  <div
    class="conn-screen"
    :data-tid="`connection-${state}`"
  >
    <div class="conn-screen__card">
      <printer-thumb
        :size="72"
        :state="state === 'unreachable' ? 'offline' : 'idle'"
      />
      <h1 class="conn-screen__title">
        {{ state === 'unreachable' ? `Can't reach ${printerName}` : `Connecting to ${printerName}` }}
      </h1>
      <p
        v-if="address"
        class="conn-screen__address"
      >
        {{ address }}
      </p>

      <div
        v-if="state === 'connecting'"
        class="conn-screen__bar"
        role="progressbar"
        aria-label="Connecting"
      >
        <span />
      </div>

      <p
        v-if="state === 'connecting' && retryInMs !== null"
        class="conn-screen__line"
      >
        No answer yet. Trying again in {{ retryText }}.
      </p>

      <ul
        v-if="showHelp"
        class="conn-screen__help"
        data-tid="connection-help"
      >
        <template v-if="viaCloud">
          <li>Is {{ printerName }} switched on and online? Its screen shows its Wi-Fi.</li>
          <li>Muon3D reaches it over the internet, so it needs a working Wi-Fi of its own.</li>
        </template>
        <template v-else>
          <li>Is {{ printerName }} switched on? Its screen lights up when it is.</li>
          <li>Is this device on the same Wi-Fi as {{ printerName }}?</li>
          <li v-if="hotspot">
            If it can't join a Wi-Fi, it makes its own: join <strong>{{ hotspot }}</strong>, then open this page again.
          </li>
        </template>
      </ul>

      <div class="conn-screen__actions">
        <button
          type="button"
          class="cbtn cbtn--primary"
          data-tid="connection-try-again"
          @click="tryNow"
        >
          Try again
        </button>
        <router-link
          to="/"
          class="cbtn"
        >
          Choose another printer
        </router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import ReconnectMixin from '@/mixins/reconnect'
import { retryIn } from '@/services/connection/view'
import { activeSlug } from '@/services/printer-pages'

/** After this long connecting, the screen says what to check. */
const HELP_AFTER_MS = 8000

/**
 * Instead of a printer's page until Fluidd has reached it once: the
 * printer, the address it is trying and, if it can't, what to check.
 * After the first connection a drop keeps the page instead
 * (ConnectionBanner).
 */
@Component({})
export default class ConnectingScreen extends Mixins(ReconnectMixin) {
  @Prop({ type: String, required: true })
  readonly state!: 'connecting' | 'unreachable'

  shownAt = Date.now()

  get showHelp (): boolean {
    return this.state === 'unreachable' || this.now - this.shownAt >= HELP_AFTER_MS
  }

  get retryText (): string {
    return retryIn(this.retryInMs ?? 0)
  }

  /** The hotspot an M1 makes when it can't join a Wi-Fi: Muon- and its address name (Muon-boxwood-367a). */
  get hotspot (): string | null {
    const slug = activeSlug()
    return slug && /-[0-9a-f]{4}$/.test(slug) ? `Muon-${slug}` : null
  }
}
</script>

<style lang="scss" scoped>
  .conn-screen {
    display: flex;
    justify-content: center;
    padding: 48px 16px;
  }

  .conn-screen__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 460px;
    padding: 32px 24px;
    border-radius: 24px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    text-align: center;
  }

  .conn-screen__title {
    margin: 8px 0 0;
    font-size: 22px;
    font-weight: 700;
  }

  .conn-screen__address {
    margin: 0;
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono, monospace);
    font-size: 13px;
  }

  .conn-screen__bar {
    position: relative;
    width: 100%;
    max-width: 260px;
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--m3d-surface-2);

    span {
      position: absolute;
      inset: 0 auto 0 0;
      width: 35%;
      border-radius: inherit;
      background: var(--m3d-accent);
      animation: conn-slide 1.4s ease-in-out infinite;
    }
  }

  @keyframes conn-slide {
    from { transform: translateX(-100%); }
    to { transform: translateX(300%); }
  }

  .conn-screen__line {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .conn-screen__help {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 8px 0 0;
    padding: 14px 16px 14px 32px;
    border-radius: 16px;
    background: var(--m3d-surface-2);
    font-size: 14px;
    text-align: left;
  }

  .conn-screen__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
  }
</style>
