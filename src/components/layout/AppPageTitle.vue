<template>
  <header
    class="app-page-header"
    :class="{ 'app-page-header--phone': isMobileViewport }"
  >
    <div class="app-page-header__row">
      <div class="app-page-header__titles">
        <div class="app-page-header__title-row">
          <h1
            class="app-page-header__title"
            data-tid="page-title"
          >
            {{ title }}
          </h1>
          <tone-pill
            v-if="overviewHome"
            :tone="pillTone"
          >
            {{ pillText }}
          </tone-pill>
        </div>
        <p
          v-if="subtitle"
          class="app-page-header__subtitle"
        >
          {{ subtitle }}
        </p>
      </div>
      <div class="app-page-header__actions">
        <control-actions v-if="currentSection && currentSection.id === 'control' && !isMobileViewport" />
        <overview-actions v-if="overviewHome && !isMobileViewport" />
        <maintenance-due v-if="currentPage === '/maintenance'" />
        <button
          v-if="canEditLayout"
          type="button"
          class="app-page-header__btn"
          data-tid="edit-layout"
          @click="editLayout"
        >
          <frame-icon
            name="layout"
            small
          />
          Edit layout
        </button>
      </div>
    </div>
    <nav
      v-if="tabs.length > 1"
      class="app-page-header__tabs"
      :aria-label="`${title} pages`"
    >
      <router-link
        v-for="page in tabs"
        :key="page.path"
        :to="pageTo(page)"
        class="app-page-header__tab"
        :class="{ 'app-page-header__tab--on': isOn(page) }"
        :aria-current="isOn(page) ? 'page' : undefined"
      >
        {{ page.label }}
      </router-link>
    </nav>
  </header>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FrameMixin from '@/mixins/frame'
import BrowserMixin from '@/mixins/browser'
import { pageMatches, type SectionPage } from '@/router/printerSections'
import ControlActions from '@/components/control/ControlActions.vue'
import OverviewActions from '@/components/overview/OverviewActions.vue'
import MaintenanceDue from '@/components/maintenance/MaintenanceDue.vue'
import TonePill from '@/components/printers/TonePill.vue'
import PrinterStatusMixin from '@/mixins/printer-status'
import { cloudState } from '@/services/muon-cloud/state'
import { jobName } from '@/services/printers-page/model'
import { printerNameParts } from '@/util/printer-name'
import type { TileTone } from '@/services/printers-page/model'

/**
 * A printer page's title on the left and its own actions on the right,
 * with the section's pages as tabs under it (Jobs: Jobs, Preview, History,
 * Timelapse).
 */
@Component({ components: { ControlActions, OverviewActions, MaintenanceDue, TonePill } })
export default class AppPageTitle extends Mixins(FrameMixin, BrowserMixin, PrinterStatusMixin) {
  /** Overview is the printer's own page: it is named by the printer, with its state beside it. */
  get overviewHome (): boolean {
    return this.currentSection?.id === 'overview' && this.currentPage === '/'
  }

  get title (): string {
    if (this.overviewHome) return printerNameParts(this.displayName).name
    return this.currentSection?.label ?? this.$route.name ?? ''
  }

  get pillTone (): TileTone {
    const tones: Record<string, TileTone> = { ok: 'ok', active: 'run', warn: 'warn', fault: 'err', off: 'off' }
    return tones[this.statusTone] ?? 'off'
  }

  get pillText (): string {
    if (!this.socketConnected) return 'Offline'
    if (!this.klippyReady) return 'Not ready'
    return this.$filters.prettyCase(this.printerState || 'ready')
  }

  /** A line under the title, for a page that says what it holds. */
  get subtitle (): string {
    if (this.isMobileViewport) return ''
    if (this.overviewHome) {
      const file = this.$store.state.printer.printer.print_stats?.filename as string | undefined
      const route = cloudState.activePrinterId ? 'Through Muon3D' : 'On this network'
      if ((this.printerPrinting || this.printerPaused) && file) {
        const duration = this.$store.state.printer.printer.print_stats?.total_duration as number | undefined
        const started = duration ? new Date(Date.now() - duration * 1000) : null
        const at = started ? ` · started ${String(started.getHours()).padStart(2, '0')}:${String(started.getMinutes()).padStart(2, '0')}` : ''
        return `${jobName(file)}${at}`
      }
      return route
    }
    if (this.currentSection?.id === 'control') {
      return this.pro
        ? 'Pro: the exact values, in the same places as Simple, with more below.'
        : 'Heat, move, filament, speed, fans and lights.'
    }
    if (this.currentPage === '/maintenance') {
      return "What keeps prints coming out right. Each check says when it last ran and whether it's due."
    }
    return ''
  }

  get tabs (): SectionPage[] {
    return this.currentSection ? this.pagesOf(this.currentSection) : []
  }

  isOn (page: SectionPage): boolean {
    return pageMatches(this.currentPage, page.path)
  }

  /** The charts page is laid out from cards; Edit layout arranges them. */
  get canEditLayout (): boolean {
    if (this.isMobileViewport || this.$store.state.config.layoutMode) return false
    return this.currentPage === '/diagnostics'
  }

  editLayout () {
    this.$store.commit('config/setLayoutMode', true)
  }
}
</script>

<style lang="scss" scoped>
  .app-page-header {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 4px 4px 20px;
  }

  .app-page-header__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
  }

  .app-page-header__titles {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .app-page-header__title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .app-page-header__subtitle {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .app-page-header__title {
    overflow: hidden;
    margin: 0;
    color: var(--m3d-text);
    font-family: var(--m3d-font-title, var(--m3d-font-sans));
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.015em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-page-header__actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
  }

  .app-page-header__btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 16px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;

    &:hover {
      background: var(--m3d-hover);
    }
  }

  .app-page-header__tabs {
    display: flex;
    gap: 2px;
    align-self: flex-start;
    max-width: 100%;
    padding: 3px;
    overflow-x: auto;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    scrollbar-width: none;
  }

  .app-page-header__tab {
    display: inline-flex;
    flex: none;
    align-items: center;
    height: 34px;
    padding: 0 14px;
    border-radius: 9px;
    color: var(--m3d-text-muted) !important;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;

    &:hover {
      color: var(--m3d-text) !important;
    }
  }

  .app-page-header__tab--on {
    background: var(--m3d-fill-strong, var(--m3d-border-strong));
    color: var(--m3d-text) !important;
  }

  .app-page-header--phone {
    gap: 12px;
    padding: 4px 4px 14px;

    .app-page-header__title {
      font-size: 30px;
    }

    .app-page-header__tab {
      height: 36px;
    }
  }
</style>
