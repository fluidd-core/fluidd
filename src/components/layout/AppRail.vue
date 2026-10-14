<template>
  <v-navigation-drawer
    app
    permanent
    clipped
    class="app-rail"
    :class="{ 'app-rail--compact': compact }"
    :width="compact ? $globals.RAIL_WIDTH_COMPACT : $globals.RAIL_WIDTH"
    color="transparent"
  >
    <nav
      class="app-rail__body"
      aria-label="Pages"
    >
      <app-rail-link
        to="/"
        icon="printers"
        label="All printers"
        :keys="keysFor(allPrintersKey)"
        :compact="compact"
        data-tid="rail-all-printers"
      />

      <div class="app-rail__rule" />

      <template v-for="section in simpleSections">
        <app-rail-link
          :key="section.id"
          :to="sectionTo(section)"
          :icon="section.icon"
          :label="section.label"
          :keys="keysFor(section.key)"
          :active="currentSection === section"
          :compact="compact"
          :data-tid="`rail-${section.id}`"
        />
      </template>

      <template v-if="proSections.length">
        <div
          v-if="!compact"
          class="app-rail__label"
        >
          Pro
        </div>
        <div
          v-else
          class="app-rail__rule"
        />
        <app-rail-link
          v-for="section in proSections"
          :key="section.id"
          :to="sectionTo(section)"
          :icon="section.icon"
          :label="section.label"
          :keys="keysFor(section.key)"
          :active="currentSection === section"
          :compact="compact"
          :data-tid="`rail-${section.id}`"
        />
      </template>

      <div class="app-rail__spacer" />

      <v-tooltip
        right
        :disabled="!compact"
      >
        <template #activator="{ on, attrs }">
          <div
            class="app-rail__route"
            data-tid="rail-route"
            v-bind="attrs"
            v-on="on"
          >
            <span class="app-rail__route-title">
              <frame-icon
                :name="remote ? 'cloud' : 'wifi'"
                small
                :class="remote ? 'app-rail__route-icon--remote' : 'app-rail__route-icon'"
              />
              <span v-if="!compact">{{ routeTitle }}</span>
            </span>
            <span
              v-if="!compact && routeDetail"
              class="app-rail__route-detail"
            >{{ routeDetail }}</span>
          </div>
        </template>
        <span>{{ routeTitle }}<template v-if="routeDetail"> · {{ routeDetail }}</template></span>
      </v-tooltip>
    </nav>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FrameMixin from '@/mixins/frame'
import BrowserMixin from '@/mixins/browser'
import { ALL_PRINTERS_KEY, type Section } from '@/router/printerSections'
import { cloudState } from '@/services/muon-cloud/state'
import { hostOf } from '@/services/muon-cloud/directory'
import { probeSlicer } from '@/services/slicer-bridge/slicerUrl'
import AppRailLink from './AppRailLink.vue'

/**
 * The pages of the printer you're on, named, with their keys. Pro's two
 * sit below a label and show only with Pro on. At the bottom, how this
 * browser reaches the printer. Below the lg breakpoint it keeps the icons.
 */
@Component({ components: { AppRailLink } })
export default class AppRail extends Mixins(FrameMixin, BrowserMixin) {
  allPrintersKey = ALL_PRINTERS_KEY

  created () {
    probeSlicer()
  }

  get compact (): boolean {
    return this.$vuetify.breakpoint.mdAndDown
  }

  get simpleSections (): Section[] {
    return this.sections.filter(s => !s.pro)
  }

  get proSections (): Section[] {
    return this.sections.filter(s => s.pro)
  }

  get enableKeyboardShortcuts (): boolean {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts
  }

  keysFor (key: string): string | undefined {
    return this.enableKeyboardShortcuts ? `G ${key.toUpperCase()}` : undefined
  }

  /** Through Muon3D's service, rather than straight to the printer. */
  get remote (): boolean {
    return !!cloudState.activePrinterId
  }

  get routeTitle (): string {
    return this.remote ? 'Through Muon3D' : 'On this network'
  }

  get routeDetail (): string {
    if (this.remote) return 'Some settings are locked away from home'
    const apiUrl: string = this.$store.state.config.apiUrl || ''
    return apiUrl ? hostOf(apiUrl) : ''
  }
}
</script>

<style lang="scss" scoped>
  .app-rail {
    border-right: 1px solid var(--m3d-border);

    :deep(.v-navigation-drawer__border) {
      display: none;
    }

    :deep(.v-navigation-drawer__content) {
      overflow-y: auto;
      overflow-x: hidden;
    }
  }

  .app-rail__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 100%;
    padding: 16px 12px;
  }

  .app-rail--compact .app-rail__body {
    padding: 16px 10px;
  }

  .app-rail__rule {
    height: 1px;
    margin: 10px 8px;
    background: var(--m3d-border);
  }

  .app-rail__label {
    padding: 18px 12px 6px;
    color: var(--m3d-text-subtle);
    font-family: var(--m3d-font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .app-rail__spacer {
    flex: 1 1 auto;
    min-height: 16px;
  }

  .app-rail__route {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 14px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
  }

  .app-rail--compact .app-rail__route {
    align-items: center;
    padding: 12px 0;
  }

  .app-rail__route-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--m3d-text);
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }

  .app-rail__route-icon {
    color: var(--m3d-success);
  }

  .app-rail__route-icon--remote {
    color: var(--m3d-accent);
  }

  .app-rail__route-detail {
    overflow: hidden;
    color: var(--m3d-text-subtle);
    font-family: var(--m3d-font-mono);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
