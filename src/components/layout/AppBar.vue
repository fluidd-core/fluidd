<template>
  <v-app-bar
    app
    class="muon-app-bar"
    :clipped-left="!glass"
    extension-height="46"
    :color="$vuetify.theme.currentTheme.appbar"
    :height="$globals.HEADER_HEIGHT"
  >
    <router-link
      v-if="!isMobileViewport && !glass"
      to="/"
      class="muon-brand"
      :class="{ 'muon-brand--compact': navRail }"
      :style="navRail ? '' : `width: ${$globals.NAVIGATION_DRAWER_WIDTH}px;`"
    >
      <span class="muon-wordmark">MUON3D</span>
    </router-link>

    <div class="toolbar-title">
      <v-btn
        v-if="isMobileViewport && !glass"
        icon
        class="mobile-nav-button"
        @click="$emit('navdrawer')"
      >
        <v-icon>$menuAlt</v-icon>
      </v-btn>

      <!-- The glass style names the page, with the printer and its state under it. -->
      <v-toolbar-title
        v-if="glass && !navless"
        class="glass-title"
      >
        <span class="glass-title__main">{{ pageTitle }}</span>
        <span
          class="glass-title__sub printer-status"
          :class="`printer-status--${statusTone}`"
        >
          <span class="printer-status__dot" />
          <span class="printer-status__text">{{ pageSubtitle }}</span>
        </span>
      </v-toolbar-title>

      <v-toolbar-title
        v-else-if="!glass"
        class="printer-title"
      >
        <router-link
          :to="printerHome"
          class="printer-title__name"
        >
          {{ displayName }}
        </router-link>
        <span
          class="printer-status"
          :class="`printer-status--${statusTone}`"
        >
          <span class="printer-status__dot" />
          <span class="printer-status__text">{{ statusText }}</span>
        </span>
      </v-toolbar-title>
    </div>

    <!-- <v-spacer /> -->

    <div class="toolbar-supplemental muon-toolbar-actions">
      <div
        v-if="socketConnected && klippyReady && authenticated && showSaveConfigAndRestartForPendingChanges"
        class="mr-1"
      >
        <app-save-config-and-restart-btn
          :loading="hasWait($waits.onSaveConfig)"
          :disabled="printerPrinting || printerPaused"
          @click="saveConfigAndRestart"
        />
      </div>

      <div v-if="socketConnected && !isMobileViewport && authenticated">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <app-btn
              :disabled="!klippyReady"
              v-bind="attrs"
              outlined
              small
              class="estop-action mx-1"
              color="error"
              v-on="on"
              @click="emergencyStop()"
            >
              <v-icon
                small
                left
              >
                $estop
              </v-icon>
              E-Stop
            </app-btn>
          </template>
          <span>
            {{ $t('app.general.tooltip.estop') }}
            <template v-if="enableKeyboardShortcuts">
              <br>
              <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>e</kbd>
            </template>
          </span>
        </v-tooltip>
      </div>

      <app-status-alerts v-if="authenticated" />

      <div v-if="authenticated && socketConnected && showUploadAndPrint">
        <app-upload-and-print-btn
          :tooltip="uploadTooltip"
          @upload="handleUploadAndPrint"
        />
      </div>

      <div class="muon-toolbar-group">
        <div v-if="authenticated && socketConnected && topNavPowerToggle">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <app-btn
                fab
                small
                :elevation="0"
                class="toolbar-action mr-1 bg-transparent"
                color="transparent"
                :disabled="topNavPowerDeviceDisabled"
                v-bind="attrs"
                v-on="on"
                @click="handlePowerToggle()"
              >
                <v-icon>
                  {{ topNavPowerDeviceOn ? '$powerOn' : '$powerOff' }}
                </v-icon>
              </app-btn>
            </template>
            <span>{{ $t(`app.general.label.turn_device_${topNavPowerDeviceOn ? 'off' : 'on'}`, { device: topNavPowerToggle.name }) }}</span>
          </v-tooltip>
        </div>

        <div
          v-if="authenticated && socketConnected"
          class="toolbar-action mr-1"
        >
          <app-notification-menu />
        </div>

        <div
          v-if="supportsAuth && authenticated && $vuetify.breakpoint.lgAndUp"
          class="toolbar-action mr-1"
        >
          <app-wifi-button />
        </div>

        <cloud-account-menu class="toolbar-action" />

        <app-btn
          fab
          small
          :elevation="0"
          class="toolbar-action mr-1"
          color="transparent"
          @click="$emit('toolsdrawer')"
        >
          <v-icon>$menu</v-icon>
        </app-btn>
      </div>
    </div>

    <template
      v-if="inLayout"
      #extension
    >
      <app-btn
        small
        class="layout-action mx-2"
        color="primary"
        @click.stop="handleExitLayout"
      >
        {{ $t('app.general.btn.exit_layout') }}
      </app-btn>
      <app-btn
        small
        class="layout-action mx-2"
        color="primary"
        @click.stop="handleResetLayout"
      >
        {{ $t('app.general.btn.reset_layout') }}
      </app-btn>
      <template v-if="isDashboard">
        <v-divider
          vertical
          class="mx-2"
        />
        <app-btn
          small
          class="layout-action mx-2"
          color="primary"
          @click.stop="handleSetDefaultLayout"
        >
          {{ $t('app.general.btn.set_default_layout') }}
        </app-btn>
        <app-btn
          small
          class="mx-2"
          color="primary"
          @click.stop="handleResetDefaultLayout"
        >
          {{ $t('app.general.btn.reset_default_layout') }}
        </app-btn>
      </template>
    </template>

    <pending-changes-dialog
      v-if="pendingChangesDialogOpen"
      v-model="pendingChangesDialogOpen"
      @save="saveConfigAndRestart(true)"
    />
  </v-app-bar>
</template>

<script lang="ts">
import CloudAccountMenu from '@/components/muon-cloud/CloudAccountMenu.vue'
import { Component, Mixins } from 'vue-property-decorator'
import PendingChangesDialog from '@/components/settings/PendingChangesDialog.vue'
import AppSaveConfigAndRestartBtn from './AppSaveConfigAndRestartBtn.vue'
import AppUploadAndPrintBtn from './AppUploadAndPrintBtn.vue'
import { defaultState } from '@/store/layout/state'
import PrinterStatusMixin from '@/mixins/printer-status'
import ServicesMixin from '@/mixins/services'
import FilesMixin from '@/mixins/files'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import { EventBus } from '@/eventBus'
import type { OutputPin } from '@/store/printer/types'
import type { Device } from '@/store/power/types'
import AppWifiButton from '@/components/ui/AppWifiButton.vue'
import { printerHomePath } from '@/services/printer-pages'
import { pageOfRoute } from '@/router/printerPagePaths'

@Component({
  components: {
    CloudAccountMenu,
    PendingChangesDialog,
    AppSaveConfigAndRestartBtn,
    AppUploadAndPrintBtn,
    AppWifiButton
  }
})
export default class AppBar extends Mixins(PrinterStatusMixin, ServicesMixin, FilesMixin, BrowserMixin) {
  /** The printer's own page: its name leads there, the wordmark to every printer. */
  get printerHome (): string {
    return printerHomePath()
  }

  menu = false
  pendingChangesDialogOpen = false

  get supportsAuth () {
    return this.$store.getters['server/componentSupport']('authorization')
  }

  get instances () {
    return this.$store.state.config.instances
  }

  get instanceName () {
    return this.$store.state.config.uiSettings.general.instanceName
  }

  get navRail (): boolean {
    return !this.isMobileViewport && this.$vuetify.breakpoint.mdAndDown
  }

  // The glass toolbar starts beside the sidebar, which carries the wordmark.
  get glass (): boolean {
    return this.$store.getters['config/getUiStyle'] === 'glass'
  }

  // App.vue's glassNavless: no printer and a page that needs none, so no
  // sidebar and no page title; the page carries its own heading.
  get navless (): boolean {
    return this.glass && this.$route.meta?.printerIndependent === true &&
      !(this.authenticated && this.socketConnected)
  }

  get currentFile () {
    return this.$store.state.printer.printer.print_stats.filename
  }

  get hasUpdates () {
    return this.$store.getters['version/hasUpdates']
  }

  get saveConfigPending (): boolean {
    return this.$store.getters['printer/getSaveConfigPending'] as boolean
  }

  get saveConfigPendingItems (): Record<string, Record<string, string>> {
    return this.$store.getters['printer/getSaveConfigPendingItems'] as Record<string, Record<string, string>>
  }

  get showSaveConfigAndRestartForPendingChanges (): boolean {
    if (!this.showSaveConfigAndRestart || !this.saveConfigPending) {
      return false
    }

    const sectionsToIgnore = this.sectionsToIgnorePendingConfigurationChanges

    return (
      sectionsToIgnore.length === 0 ||
      Object.keys(this.saveConfigPendingItems)
        .filter(key => !sectionsToIgnore.includes(key))
        .length > 0
    )
  }

  get devicePowerComponentEnabled () {
    return this.$store.getters['server/componentSupport']('power')
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  get showSaveConfigAndRestart (): boolean {
    return this.$store.state.config.uiSettings.general.showSaveConfigAndRestart as boolean
  }

  get sectionsToIgnorePendingConfigurationChanges (): string[] {
    return this.$store.state.config.uiSettings.general.sectionsToIgnorePendingConfigurationChanges as string[]
  }

  get showUploadAndPrint (): boolean {
    return this.$store.state.config.uiSettings.general.showUploadAndPrint
  }

  get topNavPowerToggle () {
    const topNavPowerToggle = this.$store.state.config.uiSettings.general.topNavPowerToggle as string | null

    if (!topNavPowerToggle) return null

    const [name, type] = topNavPowerToggle.split(':')

    switch (type) {
      case 'klipper': {
        const device = this.$store.getters['printer/getPinByName'](name) as OutputPin | undefined

        return {
          type,
          name: device?.prettyName ?? name,
          device
        }
      }

      default: {
        const device = this.$store.getters['power/getDeviceByName'](topNavPowerToggle) as Device

        return {
          type: 'moonraker' as const,
          name: topNavPowerToggle,
          device
        }
      }
    }
  }

  get topNavPowerDeviceOn (): boolean {
    const { type, device } = this.topNavPowerToggle || {}

    if (!device) return false

    switch (type) {
      case 'moonraker':
        return device.status === 'on'

      case 'klipper':
        return device.value !== 0
    }

    return false
  }

  get topNavPowerDeviceDisabled (): boolean {
    const { type, device } = this.topNavPowerToggle || {}

    if (!device) return true

    switch (type) {
      case 'moonraker':
        return (this.printerPrinting && device.locked_while_printing) || ['init', 'error'].includes(device.status) || (!this.devicePowerComponentEnabled)

      case 'klipper':
        return !this.klippyReady
    }

    return true
  }

  get enableKeyboardShortcuts (): boolean {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts
  }

  handleExitLayout () {
    this.$store.commit('config/setLayoutMode', false)
  }

  get isDashboard () {
    return this.$route.name === 'Dashboard'
  }

  handleResetLayout () {
    const pathLayouts: Record<string, string> = {
      '/diagnostics': 'diagnostics'
    }

    const pathLayout = pathLayouts[pageOfRoute(this.$route)]
    let layoutDefaultState
    if (pathLayout) {
      // reset to default init state
      layoutDefaultState = defaultState().layouts[pathLayout]
    } else {
      // reset dashboard to default layout
      layoutDefaultState = this.$store.getters['layout/getLayout']('dashboard')
    }

    const toReset = pathLayout ?? this.$store.getters['layout/getSpecificLayoutName']

    this.$store.dispatch('layout/onLayoutChange', {
      name: toReset,
      value: layoutDefaultState
    })
  }

  handleSetDefaultLayout () {
    const currentLayoutName = this.$store.getters['layout/getSpecificLayoutName']
    this.$store.dispatch('layout/onLayoutChange', {
      name: 'dashboard',
      value: this.$store.getters['layout/getLayout'](currentLayoutName)
    })
  }

  handleResetDefaultLayout () {
    this.$store.dispatch('layout/onLayoutChange', {
      name: 'dashboard',
      value: defaultState().layouts.dashboard
    })
  }

  async handlePowerToggle () {
    const { type, device } = this.topNavPowerToggle || {}

    if (!device) return

    const confirmOnPowerDeviceChange = this.$store.state.config.uiSettings.general.confirmOnPowerDeviceChange

    const result = (
      !confirmOnPowerDeviceChange ||
      await this.$confirm(
        this.$tc('app.general.simple_form.msg.confirm_power_device_toggle'),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
      )
    )

    if (result) {
      switch (type) {
        case 'moonraker': {
          const state = (device.status === 'on') ? 'off' : 'on'
          SocketActions.machineDevicePowerToggle(device.device, state)
          break
        }

        case 'klipper': {
          const value = (device.value !== 0) ? 0 : device.scale
          this.sendGcode(`SET_PIN PIN=${device.name} VALUE=${value}`, `${this.$waits.onSetOutputPin}${device.name}`)
          break
        }
      }
    }
  }

  // Idle, the file prints as soon as it is up. Mid-print, it goes to the job
  // queue, and with Klipper down it is only uploaded, so the button always
  // does something.
  get uploadPrintsNow (): boolean {
    return this.klippyReady && !this.printerPrinting && !this.printerPaused
  }

  get uploadQueues (): boolean {
    return !this.uploadPrintsNow && this.klippyReady &&
      this.$store.getters['server/componentSupport']('job_queue')
  }

  get uploadTooltip (): string {
    if (this.uploadPrintsNow) return this.$tc('app.general.label.upload_and_print')
    if (this.uploadQueues) return this.$tc('app.general.label.upload_and_queue')
    return this.$tc('app.general.btn.upload')
  }

  async handleUploadAndPrint (file: File) {
    if (this.uploadPrintsNow) {
      await this.uploadFile(file, '/', 'gcodes', true)
      return
    }

    const queue = this.uploadQueues
    await this.uploadFile(file, '/', 'gcodes', false)

    if (queue) {
      await SocketActions.serverJobQueuePostJob([file.name])
      EventBus.$emit(this.$t('app.general.msg.upload_queued', { name: file.name }).toString(), { timeout: 4000 })
    } else {
      EventBus.$emit(this.$t('app.general.msg.upload_saved', { name: file.name }).toString(), { timeout: 4000 })
    }
  }

  saveConfigAndRestart (force = false) {
    if (!force) {
      const confirmOnSaveConfigAndRestart = this.$store.state.config.uiSettings.general.confirmOnSaveConfigAndRestart

      if (confirmOnSaveConfigAndRestart) {
        this.pendingChangesDialogOpen = true

        return
      }
    }

    this.sendGcode('SAVE_CONFIG', this.$waits.onSaveConfig)
  }
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  .muon-app-bar {
    border-bottom: 1px solid var(--m3d-border) !important;
  }

  :deep(.v-toolbar__content) {
    padding: 0 8px 0 0;
  }

  .muon-brand {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    align-self: stretch;
    padding: 0 20px;
    border-right: 1px solid var(--m3d-border);
    color: var(--m3d-text);
    text-decoration: none;
  }

  .muon-brand--compact {
    border-right: 0;
    padding-right: 0;
  }

  .toolbar-title {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    height: inherit;
    align-items: center;
    gap: 8px;
    padding: 0 20px;
  }

  // Only the glass style draws the icon actions as one group.
  .muon-toolbar-group {
    display: contents;
  }

  .toolbar-supplemental {
    display: flex;
    flex: 0 0 auto;
    justify-content: flex-end;
    align-items: center;
    gap: 2px;
    height: inherit;
  }

  .printer-title {
    display: flex;
    align-items: baseline;
    min-width: 0;
    gap: 14px;
    overflow: hidden;
  }

  .printer-title__name {
    overflow: hidden;
    color: var(--m3d-text) !important;
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .printer-status {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 7px;
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .printer-status__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background-color: currentColor;
  }

  .printer-status--ok .printer-status__dot { color: var(--m3d-success); }
  .printer-status--active .printer-status__dot { color: var(--m3d-accent); }
  .printer-status--warn .printer-status__dot { color: var(--m3d-warning); }
  .printer-status--fault { color: var(--m3d-danger); }
  .printer-status--off .printer-status__dot { color: var(--m3d-text-subtle); }

  /* Every icon action in the bar is the same 36px square. */
  .toolbar-supplemental :deep(.v-btn--fab.v-size--small),
  .toolbar-supplemental :deep(.v-btn--icon),
  .mobile-nav-button {
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
  }

  .toolbar-supplemental :deep(.v-btn--fab.v-size--small .v-icon),
  .toolbar-supplemental :deep(.v-btn--icon .v-icon) {
    color: var(--m3d-text-muted);
  }

  .toolbar-supplemental :deep(.v-btn--fab.v-size--small:hover .v-icon),
  .toolbar-supplemental :deep(.v-btn--icon:hover .v-icon) {
    color: var(--m3d-text);
  }

  .toolbar-supplemental :deep(.v-btn.btncolor) {
    background-color: transparent !important;
    border: 0 !important;
  }

  .toolbar-supplemental :deep(.mr-1) {
    margin-right: 0 !important;
  }

  .estop-action {
    height: 32px !important;
    margin-right: 8px !important;
    border-width: 1px;
    letter-spacing: 0.08em;
  }

  .estop-action:not(.v-btn--disabled):hover {
    background-color: var(--m3d-danger) !important;
    color: #fff !important;
  }

  .v-toolbar--extended :deep(.v-toolbar__extension) {
    border-top: 1px solid var(--m3d-border);
  }

  :deep(.v-toolbar__extension) {
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .layout-action {
    min-height: 32px !important;
  }

  .v-btn.v-btn--disabled.v-btn--has-bg.bg-transparent {
    background: none !important;
  }

  @media #{map-get($display-breakpoints, 'xs-only')} {
    .toolbar-title {
      padding: 0 4px;
    }

    .printer-title {
      flex-direction: column;
      gap: 1px;
    }

    .printer-title__name {
      font-size: 0.9375rem;
    }

    .printer-status {
      font-size: 0.6875rem;
    }
  }
</style>
