<template>
  <v-app-bar
    app
    clipped-left
    flat
    class="app-header"
    :class="{ 'app-header--phone': phone }"
    color="transparent"
    extension-height="46"
    :height="phone ? $globals.HEADER_HEIGHT_PHONE : $globals.HEADER_HEIGHT"
  >
    <!-- A phone: the printer you're on, its alerts, and STOP. -->
    <template v-if="phone">
      <printer-switch-button
        v-if="printerFrame"
        phone
      />
      <router-link
        v-else
        to="/"
        class="app-header__brand app-header__brand--grow"
        aria-label="All printers"
      >
        <span class="muon-wordmark">MUON3D</span>
      </router-link>

      <div class="app-header__actions">
        <app-status-alerts v-if="!sectionContext.foreign && authenticated" />
        <button
          type="button"
          class="app-header__icon"
          aria-label="Search or run a command"
          data-tid="command-bar-open"
          @click="openCommands"
        >
          <frame-icon name="search" />
        </button>
        <app-notification-menu v-if="!sectionContext.foreign && authenticated && socketConnected" />
        <cloud-account-menu v-if="!printerFrame" />
      </div>

      <button
        v-if="showEstop"
        type="button"
        class="app-header__estop app-header__estop--small"
        :disabled="!klippyReady"
        :aria-label="$tc('app.general.tooltip.estop')"
        data-tid="estop"
        @click="emergencyStop()"
      >
        <frame-icon
          name="estop"
          small
        />
        STOP
      </button>
    </template>

    <!-- A computer: where you are, what the printer is doing, how to stop it. -->
    <template v-else>
      <router-link
        to="/"
        class="app-header__brand"
        aria-label="All printers"
        data-tid="header-brand"
      >
        <span class="muon-wordmark">MUON3D</span>
      </router-link>

      <printer-switch-button v-if="printerFrame" />
      <span
        v-else
        class="app-header__place"
      >{{ placeName }}</span>

      <button
        type="button"
        class="app-header__cmd"
        aria-label="Search or run a command"
        data-tid="command-bar-open"
        @click="openCommands"
      >
        <frame-icon
          name="search"
          small
        />
        <span class="app-header__cmd-text">Search or run a command</span>
        <kbd class="app-header__cmd-keys">{{ commandKeys }}</kbd>
      </button>

      <div class="app-header__actions">
        <app-save-config-and-restart-btn
          v-if="!sectionContext.foreign && socketConnected && klippyReady && authenticated && showSaveConfigAndRestartForPendingChanges"
          :loading="hasWait($waits.onSaveConfig)"
          :disabled="printerPrinting || printerPaused"
          @click="saveConfigAndRestart"
        />

        <app-status-alerts v-if="!sectionContext.foreign && authenticated" />

        <app-upload-and-print-btn
          v-if="printerFrame && !sectionContext.foreign && authenticated && socketConnected && showUploadAndPrint"
          :tooltip="uploadTooltip"
          @upload="handleUploadAndPrint"
        />

        <v-tooltip
          v-if="!sectionContext.foreign && printerFrame && authenticated && socketConnected && topNavPowerToggle"
          bottom
        >
          <template #activator="{ on, attrs }">
            <app-btn
              fab
              small
              :elevation="0"
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

        <app-notification-menu v-if="!sectionContext.foreign && authenticated && socketConnected" />

        <v-tooltip
          v-if="enableKeyboardShortcuts && $vuetify.breakpoint.mdAndUp"
          bottom
        >
          <template #activator="{ on, attrs }">
            <button
              type="button"
              class="app-header__icon"
              aria-label="Keyboard shortcuts"
              data-tid="keys"
              v-bind="attrs"
              v-on="on"
              @click="openKeys"
            >
              <frame-icon name="keyboard" />
            </button>
          </template>
          <span>Keyboard shortcuts <kbd>?</kbd></span>
        </v-tooltip>

        <cloud-account-menu />
      </div>

      <template v-if="showEstop">
        <span class="app-header__rule" />
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <button
              type="button"
              class="app-header__estop"
              :disabled="!klippyReady"
              :aria-label="$tc('app.general.tooltip.estop')"
              data-tid="estop"
              v-bind="attrs"
              v-on="on"
              @click="emergencyStop()"
            >
              <frame-icon
                name="estop"
                small
              />
              E-STOP
            </button>
          </template>
          <span>
            {{ $t('app.general.tooltip.estop') }}
            <template v-if="enableKeyboardShortcuts">
              <br>
              <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>e</kbd>
            </template>
          </span>
        </v-tooltip>
      </template>
    </template>

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

    <input
      ref="uploadInput"
      type="file"
      :accept="gcodeAccept"
      class="app-header__upload"
      tabindex="-1"
      aria-hidden="true"
      @change="onUploadPicked"
    >

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
import PrinterSwitchButton from './PrinterSwitchButton.vue'
import { defaultState } from '@/store/layout/state'
import FrameMixin from '@/mixins/frame'
import ServicesMixin from '@/mixins/services'
import FilesMixin from '@/mixins/files'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import { EventBus } from '@/eventBus'
import type { OutputPin } from '@/store/printer/types'
import type { Device } from '@/store/power/types'
import { pageOfRoute } from '@/router/printerPagePaths'

/**
 * The header answers three questions in order: where am I (Muon3D, the
 * printer), what is this printer doing (its status, beside its name), and
 * how do I stop it (E-STOP, alone at the far end). On a page with no
 * printer it names the page instead and has no E-STOP.
 */
@Component({
  components: {
    CloudAccountMenu,
    PendingChangesDialog,
    AppSaveConfigAndRestartBtn,
    AppUploadAndPrintBtn,
    PrinterSwitchButton
  }
})
export default class AppBar extends Mixins(FrameMixin, ServicesMixin, FilesMixin, BrowserMixin) {
  pendingChangesDialogOpen = false

  get phone (): boolean {
    return this.isMobileViewport
  }

  get showEstop (): boolean {
    return !this.sectionContext.foreign && this.printerFrame && this.authenticated && this.socketConnected
  }

  /** A page with no printer names itself: Printers, Fleet, Slice. */
  get placeName (): string {
    if (this.$route.path === '/') return 'Printers'
    if (this.$route.name === 'Slice (no printer)') return 'Slice'
    if (this.$route.name?.startsWith('Library')) return 'Library'
    if (this.$route.name?.startsWith('Account')) return 'Account'
    return this.$route.name ?? ''
  }


  openKeys () {
    EventBus.bus.$emit('keyboard-shortcuts')
  }

  openCommands () {
    EventBus.bus.$emit('command-bar')
  }

  /** ⌘ K on a Mac, Ctrl K elsewhere. */
  get commandKeys (): string {
    return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘ K' : 'Ctrl K'
  }

  created () {
    EventBus.bus.$on('upload-file', this.pickUpload)
  }

  beforeDestroy () {
    EventBus.bus.$off('upload-file', this.pickUpload)
  }

  /** U: choose a file to print, as the upload button does. */
  pickUpload () {
    (this.$refs.uploadInput as HTMLInputElement | undefined)?.click()
  }

  async onUploadPicked (event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (file) await this.handleUploadAndPrint(file)
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

  /** What U's picker takes: the G-code root's own list, as the header's upload button uses. */
  get gcodeAccept (): string {
    const root = this.$store.getters['files/getRootProperties']('gcodes') as { accepts?: string[] } | undefined
    return (root?.accepts ?? []).join(',')
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

    const turnOff = this.topNavPowerDeviceOn
    const name = this.topNavPowerToggle?.name ?? 'the power'
    const result = (
      !confirmOnPowerDeviceChange ||
      await this.$confirm(
        turnOff ? 'Whatever runs from it loses power at once.' : 'It switches on straight away.',
        { title: `Turn ${name} ${turnOff ? 'off' : 'on'}?`, buttonTrueText: turnOff ? 'Turn off' : 'Turn on', danger: turnOff }
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

  // Idle, the file goes up and Ready to print opens, where Print now asks
  // the plate check like every other print. Mid-print, it goes to the job
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
      // Never Moonraker's print-on-upload: that started the print with no
      // plate check, on a printer that prints upside down onto its plate.
      await this.uploadFile(file, '/', 'gcodes', false)
      EventBus.bus.$emit('job-ready', file.name)
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

<style lang="scss">
  // A sheet's scrim must not cover STOP: while one is open on a phone, the
  // top bar stands above the scrim. The sheet rises from the bottom, so the
  // two never overlap.
  .v-application:has(.v-bottom-sheet.v-dialog--active) .v-app-bar.app-header,
  body:has(.v-bottom-sheet.v-dialog--active) .v-app-bar.app-header {
    z-index: 202 !important;
  }
</style>

<style lang="scss" scoped>
  .app-header {
    border-bottom: 1px solid var(--m3d-border) !important;
    background-color: var(--m3d-bg) !important;

    :deep(.v-toolbar__content) {
      gap: 12px;
      padding: 0 20px;
    }

    :deep(.v-toolbar__extension) {
      flex: 1 1 auto;
      align-items: center;
      justify-content: center;
      padding: 0;
      border-top: 1px solid var(--m3d-border);
    }
  }

  .app-header--phone :deep(.v-toolbar__content) {
    gap: 8px;
    padding: 0 12px 0 16px;
  }

  .app-header__brand {
    display: flex;
    flex: none;
    align-items: center;
    height: 40px;
    padding-right: 8px;
    color: var(--m3d-text) !important;
    text-decoration: none;

    .muon-wordmark {
      color: var(--m3d-text);
      font-size: 13px;
      letter-spacing: 0.24em;
    }
  }

  .app-header__brand--grow {
    flex: 1 1 0;

    .muon-wordmark {
      font-size: 12px;
    }
  }

  .app-header__upload {
    display: none;
  }

  // Search or run a command: a box in the middle, a button when narrow.
  .app-header__cmd {
    display: flex;
    flex: 0 1 380px;
    align-items: center;
    gap: 10px;
    min-width: 40px;
    height: 40px;
    margin: 0 auto;
    padding: 0 8px 0 14px;
    border-radius: 12px;
    background: var(--m3d-surface);
    color: var(--m3d-text-subtle);
    font-size: 14px;
    text-align: left;

    &:hover {
      color: var(--m3d-text-muted);
      box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
    }
  }

  .app-header__cmd-text {
    flex: 1 1 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-header__cmd-keys {
    flex: none;
  }

  @media (max-width: 1199px) {
    .app-header__cmd {
      flex: none;
      justify-content: center;
      width: 40px;
      padding: 0;
      background: transparent;
      color: var(--m3d-text-muted);
    }

    .app-header__cmd-text,
    .app-header__cmd-keys {
      display: none;
    }
  }

  .app-header__place {
    overflow: hidden;
    color: var(--m3d-text);
    font-size: 17px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Every icon action is the same 40 px square, 4 px apart. */
  .app-header__actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: 4px;

    :deep(.v-btn.v-btn--fab.v-size--small),
    :deep(.v-btn.v-btn--icon) {
      width: 40px !important;
      min-width: 40px !important;
      height: 40px !important;
      margin: 0 !important;
      border-radius: 12px !important;
      background-color: transparent !important;
      box-shadow: none !important;
    }

    :deep(.v-btn.v-btn--fab.v-size--small .v-icon),
    :deep(.v-btn.v-btn--icon .v-icon) {
      color: var(--m3d-text-muted);
    }

    :deep(.v-btn.v-btn--fab.v-size--small:hover),
    :deep(.v-btn.v-btn--icon:hover) {
      background-color: var(--m3d-hover) !important;

      .v-icon {
        color: var(--m3d-text);
      }
    }

    :deep(.mr-1) {
      margin-right: 0 !important;
    }

    :deep(> div) {
      display: flex;
      align-items: center;
    }
  }

  .app-header__icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    color: var(--m3d-text-muted);

    &:hover {
      background: var(--m3d-hover);
      color: var(--m3d-text);
    }
  }

  .app-header__rule {
    flex: none;
    width: 1px;
    height: 28px;
    background: var(--m3d-border-strong);
  }

  /* E-STOP stands alone: solid red, one line, always in the same place. */
  .app-header__estop {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 8px;
    height: 40px;
    padding: 0 18px 0 14px;
    border-radius: 999px;
    background: var(--m3d-estop, #e0241f);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.06em;
    white-space: nowrap;
    transition: background-color var(--m3d-duration-fast) var(--m3d-ease);

    &:hover:not(:disabled) {
      background: color-mix(in srgb, var(--m3d-estop, #e0241f) 86%, #000);
    }

    // Klipper not ready: still the E-STOP, in its place, but a tint.
    &:disabled {
      background: color-mix(in srgb, var(--m3d-estop, #e0241f) 16%, transparent);
      color: var(--m3d-danger);
      cursor: default;
    }

    .frame-icon {
      stroke-width: 2.2;
    }
  }

  .app-header__estop--small {
    height: 36px;
    padding: 0 12px;
    font-size: 12px;
  }

  .layout-action {
    min-height: 32px !important;
  }

  // Narrower windows keep every control at full size: the printer switch
  // gives up width first (its status line has its own ellipsis), then the
  // wordmark goes, as the rail's first icon opens every printer too.
  @media (max-width: 1023px) {
    .app-header :deep(.printer-switch__button) {
      min-width: 0 !important;
    }
  }

  @media (max-width: 899px) {
    .app-header:not(.app-header--phone) .app-header__brand {
      display: none;
    }
  }
</style>
