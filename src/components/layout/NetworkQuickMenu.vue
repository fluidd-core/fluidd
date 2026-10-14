<template>
  <v-menu
    ref="menu"
    v-model="open"
    :close-on-click="false"
    :close-on-content-click="false"
    top
    offset-y
    :nudge-top="8"
    min-width="320"
    max-width="340"
    max-height="calc(100vh - 140px)"
    content-class="netq"
    transition="slide-y-reverse-transition"
  >
    <template #activator="{ on, attrs }">
      <button
        type="button"
        class="netq__toggle"
        :class="{ 'netq__toggle--open': open }"
        :aria-expanded="open ? 'true' : 'false'"
        aria-haspopup="dialog"
        data-tid="rail-route"
        :title="compact ? `${title}${detail ? ` · ${detail}` : ''}` : undefined"
        v-bind="attrs"
        v-on="on"
      >
        <slot />
      </button>
    </template>

    <div
      ref="panel"
      class="netq__panel"
      role="dialog"
      aria-label="Network"
      data-tid="network-quick"
      @keydown.esc="open = false"
    >
      <header class="netq__head">
        <frame-icon
          :name="remote ? 'cloud' : 'wifi'"
          small
        />
        <div>
          <b>{{ title }}</b>
          <span v-if="detail">{{ detail }}</span>
        </div>
      </header>

      <template v-if="open">
        <wifi-manager-card compact />
        <div class="netq__rule" />
        <hotspot-manager-card compact />
      </template>

      <router-link
        :to="settingsTo"
        class="netq__all"
        data-tid="network-quick-all"
        @click.native="open = false"
      >
        Wi-Fi and network settings
        <frame-icon
          name="chevronRight"
          small
        />
      </router-link>
    </div>
  </v-menu>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import WifiManagerCard from '@/components/widgets/wifi/WifiManagerCard.vue'
import HotspotManagerCard from '@/components/widgets/wifi/HotspotManagerCard.vue'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'

/**
 * The rail's bottom line, how this browser reaches the printer, opens to
 * the printer's Wi-Fi and hotspot: the network it's on and the next few to
 * join (with the same warnings as Settings), the hotspot's switch, and the
 * way to the whole page. The cards mount only while it is open, so nothing
 * asks the printer about Wi-Fi meanwhile. It stays open through their
 * dialogs: only a click outside both it and them, Esc, or a page change
 * closes it.
 */
@Component({ components: { WifiManagerCard, HotspotManagerCard } })
export default class NetworkQuickMenu extends Vue {
  @Prop({ type: String, required: true })
  readonly title!: string

  @Prop({ type: String, default: '' })
  readonly detail!: string

  @Prop({ type: Boolean })
  readonly remote?: boolean

  @Prop({ type: Boolean })
  readonly compact?: boolean

  open = false

  get settingsTo (): string {
    return scopedPath('/wifi', activeSlug())
  }

  resizer: ResizeObserver | null = null

  /**
   * Vuetify places a menu when it opens; this one fills in after (the
   * networks arrive), so it is placed again as it grows, staying above its
   * button rather than running off the bottom of the window.
   */
  @Watch('open')
  onOpen (open: boolean) {
    if (open) {
      document.addEventListener('mousedown', this.onOutside, true)
      this.$nextTick(() => {
        const panel = this.$refs.panel as HTMLElement | undefined
        if (!panel || typeof ResizeObserver === 'undefined') return
        this.resizer = new ResizeObserver(() => (this.$refs.menu as unknown as { onResize?: () => void } | undefined)?.onResize?.())
        this.resizer.observe(panel)
      })
    } else {
      document.removeEventListener('mousedown', this.onOutside, true)
      this.resizer?.disconnect()
      this.resizer = null
    }
  }

  @Watch('$route.path')
  onRoute () {
    this.open = false
  }

  beforeDestroy () {
    document.removeEventListener('mousedown', this.onOutside, true)
    this.resizer?.disconnect()
  }

  /** A click anywhere but the menu, its button, or a dialog or menu it opened. */
  onOutside (event: MouseEvent) {
    const target = event.target as Element | null
    if (!target || !target.closest) return
    if (target.closest('.netq, .netq__toggle, .v-dialog__content, .v-overlay, .v-menu__content')) return
    this.open = false
  }
}
</script>

<style lang="scss" scoped>
  .netq__toggle {
    display: block;
    width: 100%;
    padding: 0;
    border-radius: 14px;
    color: var(--m3d-text);
    text-align: left;

    &:focus-visible {
      outline: 2px solid var(--m3d-accent);
      outline-offset: 2px;
    }
  }

  .netq__panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px 10px;
    border: 1px solid var(--m3d-border);
    border-radius: 18px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    box-shadow: 0 12px 40px rgb(0 0 0 / 35%);
  }

  .netq__head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--m3d-border);

    div {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    b {
      font-size: 14px;
    }

    span {
      overflow: hidden;
      color: var(--m3d-text-muted);
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .netq__rule {
    height: 1px;
    background: var(--m3d-border);
  }

  .netq__all {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 40px;
    padding: 0 4px;
    border-top: 1px solid var(--m3d-border);
    color: var(--m3d-accent) !important;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
  }
</style>

<style lang="scss">
  .v-menu__content.netq {
    overflow-y: auto;
    border-radius: 18px;
    box-shadow: none;
    contain: none;
  }
</style>
