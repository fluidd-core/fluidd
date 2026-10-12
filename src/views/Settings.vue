<template>
  <div
    class="settings-page"
    :class="{ 'settings-page--phone': isMobileViewport }"
    data-tid="settings-page"
  >
    <nav
      v-if="showList"
      class="settings-list"
      aria-label="Settings sections"
    >
      <router-link
        v-for="section in sections"
        :key="section.id"
        :to="linkTo(section)"
        class="settings-list__item"
        :class="{ 'settings-list__item--on': section === current }"
        :aria-current="section === current ? 'page' : undefined"
        :data-tid="`settings-${section.id}`"
      >
        <span class="settings-list__label">{{ section.label }}</span>
        <span
          class="settings-list__hint"
          :class="{ 'settings-list__hint--warn': section.id === 'updates' && updateCount > 0 }"
        >{{ hintOf(section) }}</span>
        <frame-icon
          v-if="isMobileViewport"
          name="chevronRight"
          small
          class="settings-list__go"
        />
      </router-link>
    </nav>

    <div
      v-if="showPane"
      class="settings-pane"
      data-tid="settings-pane"
    >
      <router-link
        v-if="isMobileViewport"
        :to="listTo"
        class="settings-pane__back"
      >
        <frame-icon
          name="chevronLeft"
          small
        />
        Settings
      </router-link>

      <wifi-page v-if="ownPage === 'network'" />
      <system-page v-else-if="ownPage === 'system'" />
      <router-view v-else-if="authenticated && socketConnected" />
      <template v-if="!inChild && !ownPage && current">
        <general-settings v-if="shows('general')" />
        <theme-settings v-if="shows('theme')" />
        <access-settings v-if="shows('access') && supports('muon_access')" />
        <protection-settings v-else-if="shows('protection') && supports('muon_protection')" />
        <auth-settings v-if="shows('auth') && supports('authorization')" />
        <version-settings v-if="shows('versions')" />
        <camera-settings v-if="shows('camera')" />
        <preset-settings v-if="shows('presets')" />
        <macro-edit-list v-if="shows('macros')" />
        <macro-settings v-if="shows('macros')" />
        <timelapse-settings v-if="shows('timelapse')" />
        <spoolman-settings v-if="shows('spoolman')" />
        <console-settings v-if="shows('console')" />
        <file-browser-settings v-if="shows('browser')" />
        <file-editor-settings v-if="shows('editor')" />
        <toolhead-settings v-if="shows('toolhead')" />
        <gcode-preview-settings v-if="shows('gcodePreview')" />
        <developer-mode-settings v-if="shows('developer')" />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import { proMode } from '@/services/pro-mode'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { settingsSectionFor, visibleSettingsSections, type SettingsSection } from '@/services/settings/sections'
import { printerNameParts } from '@/util/printer-name'

import MacroSettings from '@/components/settings/macros/MacroSettings.vue'
import GeneralSettings from '@/components/settings/GeneralSettings.vue'
import PresetSettings from '@/components/settings/presets/PresetSettings.vue'
import CameraSettings from '@/components/settings/cameras/CameraSettings.vue'
import ToolheadSettings from '@/components/settings/ToolheadSettings.vue'
import ThemeSettings from '@/components/settings/ThemeSettings.vue'
import VersionSettings from '@/components/settings/VersionSettings.vue'
import GcodePreviewSettings from '@/components/settings/GcodePreviewSettings.vue'
import AuthSettings from '@/components/settings/auth/AuthSettings.vue'
import ConsoleSettings from '@/components/settings/console/ConsoleSettings.vue'
import FileBrowserSettings from '@/components/settings/FileBrowserSettings.vue'
import FileEditorSettings from '@/components/settings/FileEditorSettings.vue'
import TimelapseSettings from '@/components/settings/timelapse/TimelapseSettings.vue'
import SpoolmanSettings from '@/components/settings/SpoolmanSettings.vue'
import ProtectionSettings from '@/components/settings/ProtectionSettings.vue'
import AccessSettings from '@/components/settings/AccessSettings.vue'
import WifiPage from '@/views/Wifi.vue'
import MacroEditList from '@/components/settings/macros/MacroEditList.vue'
import DeveloperModeSettings from '@/components/settings/DeveloperModeSettings.vue'
import { devModeState, refreshDevMode } from '@/services/dev-mode/state'
import SystemPage from '@/views/System.vue'

const countOrNone = (count: number) => count ? String(count) : 'none'

/** The Moonraker components a settings section can depend on. */
const SECTION_COMPONENTS = ['authorization', 'update_manager', 'timelapse', 'spoolman', 'muon_access', 'muon_protection']

/**
 * Settings (`/boxwood-367a/settings`): the sections on the left, the one
 * chosen on the right, by the address's anchor (`#versions` is Updates).
 * Wi-Fi and System keep addresses of their own (`/wifi`, `/system`) and
 * open here too, the list still beside them. On a phone the list is a
 * page, and a section opens over it with a way back.
 */
@Component({
  components: {
    WifiPage,
    SystemPage,
    MacroEditList,
    DeveloperModeSettings,
    ProtectionSettings,
    AccessSettings,
    SpoolmanSettings,
    TimelapseSettings,
    MacroSettings,
    GeneralSettings,
    PresetSettings,
    CameraSettings,
    ToolheadSettings,
    ThemeSettings,
    VersionSettings,
    GcodePreviewSettings,
    AuthSettings,
    ConsoleSettings,
    FileBrowserSettings,
    FileEditorSettings
  }
})
export default class Settings extends Mixins(StateMixin, BrowserMixin) {
  mounted () {
    refreshDevMode()
  }

  supports (component: string): boolean {
    return this.$store.getters['server/componentSupport'](component) as boolean
  }

  get sections (): SettingsSection[] {
    return visibleSettingsSections({ pro: proMode.on, components: SECTION_COMPONENTS.filter(name => this.supports(name)) })
  }

  /** A macro category's page, inside Settings. */
  get inChild (): boolean {
    return this.$route.matched.length > 1
  }

  /** Wi-Fi's or System's own page, opened at its own address. */
  get ownPage (): 'network' | 'system' | null {
    if (this.$route.name === 'Wifi') return 'network'
    if (this.$route.name === 'System') return 'system'
    return null
  }

  /** The section shown: the anchor's, Macros for a category, else the first on a wider screen. */
  get current (): SettingsSection | null {
    if (this.ownPage) return this.sections.find(s => s.id === this.ownPage) ?? null
    if (this.inChild) return this.sections.find(s => s.id === 'macros') ?? null
    const section = settingsSectionFor(this.$route.hash, this.sections)
    if (section || this.isMobileViewport) return section
    return this.sections.find(s => !s.page) ?? null
  }

  get showList (): boolean {
    return !this.isMobileViewport || !this.current
  }

  get showPane (): boolean {
    return !!this.current
  }

  shows (anchor: string): boolean {
    return this.current?.anchors.includes(anchor) ?? false
  }

  get listTo (): string {
    return scopedPath('/settings', activeSlug())
  }

  linkTo (section: SettingsSection): string {
    if (section.page) return scopedPath(section.page, activeSlug())
    return `${this.listTo}#${section.anchors[0]}`
  }

  get updateCount (): number {
    const info = (this.$store.state.version.version_info ?? {}) as Record<string, unknown>
    const hasUpdate = this.$store.getters['version/hasUpdate'] as (component: string) => boolean
    // The OS packages count too, as the Updates card shows them.
    return Object.keys(info).filter(name => hasUpdate(name)).length
  }

  /** What's beside a section's name: the printer's name, how many cameras, whether it's up to date. */
  hintOf (section: SettingsSection): string {
    switch (section.id) {
      case 'general':
        return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name
      case 'updates':
        if (!Object.keys(this.$store.state.version.version_info ?? {}).length) return ''
        if (!this.updateCount) return 'up to date'
        return this.updateCount === 1 ? '1 update' : `${this.updateCount} updates`
      case 'cameras':
        return countOrNone((this.$store.getters['webcams/getWebcams'] as unknown[]).length)
      case 'materials':
        return countOrNone((this.$store.getters['config/getTempPresets'] as unknown[]).length)
      case 'macros':
        // Every macro the Macros card manages, hidden from the dashboard or not.
        return countOrNone((this.$store.getters['macros/getMacros'] as unknown[]).length)
      case 'system':
        return 'restart, logs'
      case 'developer':
        return devModeState.enabled === null ? '' : devModeState.enabled ? 'on' : 'off'
      default:
        return ''
    }
  }
}
</script>

<style lang="scss" scoped>
  .settings-page {
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }

  .settings-page--phone {
    grid-template-columns: minmax(0, 1fr);
  }

  .settings-list {
    position: sticky;
    top: 84px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .settings-page--phone .settings-list {
    position: static;
    padding: 6px;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .settings-list__item {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 0 12px;
    border-radius: 12px;
    color: var(--m3d-text) !important;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;

    &:hover {
      background: var(--m3d-hover);
    }
  }

  .settings-list__item--on {
    background: var(--m3d-surface-2);
    font-weight: 600;
  }

  .settings-list__label {
    flex: 1 1 auto;
    min-width: 0;
  }

  .settings-list__hint {
    overflow: hidden;
    max-width: 50%;
    color: var(--m3d-text-subtle);
    font-size: 12px;
    font-weight: 400;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .settings-list__hint--warn {
    color: var(--m3d-warning);
  }

  .settings-list__go {
    flex: none;
    color: var(--m3d-text-subtle);
  }

  .settings-pane {
    min-width: 0;
  }

  .settings-pane__back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin: 0 0 12px;
    color: var(--m3d-text-muted) !important;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
  }
</style>
