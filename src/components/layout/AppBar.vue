<template>
  <v-app-bar
    app
    clipped-left
    :extension-height="46 * (isMobileViewport ? 3 : 2)"
    :color="$vuetify.theme.currentTheme.appbar"
    :height="$globals.HEADER_HEIGHT"
  >
    <router-link
      v-if="!isMobileViewport"
      :to="{ name: 'home' }"
      class="toolbar-logo"
    >
      <app-icon />
    </router-link>

    <div class="toolbar-title">
      <app-btn
        v-if="isMobileViewport"
        icon
        text
        @click="$emit('navdrawer')"
      >
        <v-icon>$menuAlt</v-icon>
      </app-btn>

      <v-toolbar-title class="printer-title text--secondary">
        <router-link
          :to="{ name: 'home' }"
          v-html="instanceName"
        />
      </v-toolbar-title>
    </div>

    <!-- <v-spacer /> -->

    <div class="toolbar-supplemental">
      <div v-if="socketConnected && authenticated && klippyReady && showSaveConfigAndRestartForPendingChanges">
        <app-save-config-and-restart-btn
          :loading="hasWait($waits.onSaveConfig)"
          :disabled="printerPrinting || printerPaused"
          @click="saveConfigAndRestart"
        />
      </div>

      <div v-if="socketConnected && authenticated && !isMobileViewport">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <app-btn
              :disabled="!klippyReady"
              v-bind="attrs"
              class="mx-1"
              color=""
              v-on="on"
              @click="emergencyStop()"
            >
              <v-icon color="error">
                $estop
              </v-icon>
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

      <div v-if="socketConnected && authenticated && showUploadAndPrint">
        <app-upload-and-print-btn
          :disabled="printerPrinting || printerPaused || !klippyReady"
          @upload="handleUploadAndPrint"
        />
      </div>

      <div v-if="socketConnected && authenticated && topNavPowerToggle">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <app-btn
              icon
              text
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

      <div v-if="socketConnected && authenticated">
        <app-notification-menu />
      </div>

      <div v-if="socketConnected && authenticated && supportsAuth">
        <app-user-menu @change-password="userPasswordDialogOpen = true" />
      </div>

      <app-btn
        icon
        text
        @click="$emit('toolsdrawer')"
      >
        <v-icon>$menu</v-icon>
      </app-btn>
    </div>

    <template
      v-if="inLayout"
      #extension
    >
      <v-container>
        <div class="d-flex justify-center ma-2">
          <v-chip
            v-if="currentUser"
            class="mx-1"
            label
          >
            <v-icon left>
              $account
            </v-icon>
            {{ currentUser.username }}
          </v-chip>
          <v-chip
            class="mx-1"
            label
          >
            <v-icon left>
              $screenshot
            </v-icon>
            {{ currentBreakpoint.toUpperCase() }}
          </v-chip>
        </div>
        <div class="d-flex justify-center ma-2">
          <app-btn-group class="mx-1">
            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <app-btn
                  small
                  v-bind="attrs"
                  color="primary"
                  @click.stop="handleExitLayout"
                  v-on="on"
                >
                  <v-icon left>
                    $close
                  </v-icon>
                  {{ $t('app.general.btn.exit_layout') }}
                </app-btn>
              </template>
              <span>{{ $t('app.general.tooltip.exit_layout') }}</span>
            </v-tooltip>
            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <app-btn
                  small
                  v-bind="attrs"
                  color="primary"
                  @click.stop="handleResetLayout"
                  v-on="on"
                >
                  <v-icon left>
                    $accountSettings
                  </v-icon>
                  {{ $t('app.general.btn.reset_layout') }}
                </app-btn>
              </template>
              <span>{{ $t('app.general.tooltip.reset_layout') }}</span>
            </v-tooltip>
          </app-btn-group>

          <app-btn-group
            v-if="isDashboard"
            class="mx-1"
          >
            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <app-btn
                  small
                  v-bind="attrs"
                  color="primary"
                  @click.stop="handleSetDefaultLayout"
                  v-on="on"
                >
                  <v-icon left>
                    $saveDefault
                  </v-icon>
                  {{ $t('app.general.btn.set_default_layout') }}
                </app-btn>
              </template>
              <span>{{ $t('app.general.tooltip.set_default_layout') }}</span>
            </v-tooltip>

            <v-tooltip bottom>
              <template #activator="{ on, attrs }">
                <app-btn
                  small
                  v-bind="attrs"
                  color="primary"
                  @click.stop="handleResetDefaultLayout"
                  v-on="on"
                >
                  <v-icon left>
                    $resetDefaults
                  </v-icon>
                  {{ $t('app.general.btn.reset_default_layout') }}
                </app-btn>
              </template>
              <span>{{ $t('app.general.tooltip.reset_default_layout') }}</span>
            </v-tooltip>
          </app-btn-group>
        </div>
      </v-container>
    </template>

    <user-password-dialog
      v-if="userPasswordDialogOpen"
      v-model="userPasswordDialogOpen"
    />

    <pending-changes-dialog
      v-if="pendingChangesDialogOpen"
      v-model="pendingChangesDialogOpen"
      @save="saveConfigAndRestart(true)"
    />
  </v-app-bar>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UserPasswordDialog from '@/components/settings/auth/UserPasswordDialog.vue'
import PendingChangesDialog from '@/components/settings/PendingChangesDialog.vue'
import AppSaveConfigAndRestartBtn from './AppSaveConfigAndRestartBtn.vue'
import AppUploadAndPrintBtn from './AppUploadAndPrintBtn.vue'
import { defaultState } from '@/store/layout/state'
import StateMixin from '@/mixins/state'
import ServicesMixin from '@/mixins/services'
import FilesMixin from '@/mixins/files'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import type { KlipperPrinterConfig, OutputPin } from '@/store/printer/types'
import type { Device } from '@/store/power/types'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'
import vuetify from '@/plugins/vuetify'
import type { AppUser } from '@/store/auth/types'

@Component({
  components: {
    UserPasswordDialog,
    PendingChangesDialog,
    AppSaveConfigAndRestartBtn,
    AppUploadAndPrintBtn
  }
})
export default class AppBar extends Mixins(StateMixin, ServicesMixin, FilesMixin, BrowserMixin) {
  menu = false
  userPasswordDialogOpen = false
  pendingChangesDialogOpen = false

  get supportsAuth (): boolean {
    return this.$typedGetters['server/componentSupport']('authorization')
  }

  get instanceName (): string {
    return this.$typedState.config.uiSettings.general.instanceName
  }

  get hasUpdates (): boolean {
    return this.$typedGetters['version/hasUpdates']
  }

  get saveConfigPending (): boolean {
    return this.$typedGetters['printer/getSaveConfigPending']
  }

  get saveConfigPendingItems (): KlipperPrinterConfig {
    return this.$typedGetters['printer/getSaveConfigPendingItems']
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

  get devicePowerComponentEnabled (): boolean {
    return this.$typedGetters['server/componentSupport']('power')
  }

  get inLayout (): boolean {
    return (this.$typedState.config.layoutMode)
  }

  get showSaveConfigAndRestart (): boolean {
    return this.$typedState.config.uiSettings.general.showSaveConfigAndRestart
  }

  get sectionsToIgnorePendingConfigurationChanges (): string[] {
    return this.$typedState.config.uiSettings.general.sectionsToIgnorePendingConfigurationChanges
  }

  get showUploadAndPrint (): boolean {
    return this.$typedState.config.uiSettings.general.showUploadAndPrint
  }

  get topNavPowerToggle () {
    const topNavPowerToggle: string | null = this.$typedState.config.uiSettings.general.topNavPowerToggle

    if (!topNavPowerToggle) return null

    const [name, type] = topNavPowerToggle.split(':')

    switch (type) {
      case 'klipper': {
        const device: OutputPin | undefined = this.$typedGetters['printer/getPinByName'](name)

        if (!device) return null

        return {
          type,
          name: device?.prettyName ?? name,
          device
        }
      }

      default: {
        const device: Device | undefined = this.$typedGetters['power/getDeviceByName'](topNavPowerToggle)

        if (!device) return null

        return {
          type: 'moonraker' as const,
          name: this.$filters.prettyCase(topNavPowerToggle),
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
    return this.$typedState.config.uiSettings.general.enableKeyboardShortcuts
  }

  handleExitLayout () {
    this.$typedCommit('config/setLayoutMode', false)
  }

  get isDashboard () {
    return this.$route.name === 'home'
  }

  handleResetLayout () {
    const pathLayouts = [
      'diagnostics'
    ]

    const pathLayout = pathLayouts.includes(this.$route.name ?? '')
      ? this.$route.name
      : undefined
    const layoutDefaultState = pathLayout
      ? defaultState().layouts[pathLayout]
      : this.$typedGetters['layout/getLayout']('dashboard')!

    const toReset = pathLayout ?? this.$typedGetters['layout/getSpecificLayoutName']

    this.$typedDispatch('layout/onLayoutChange', {
      name: toReset,
      value: layoutDefaultState
    })
  }

  get currentLayoutName () {
    return this.$typedGetters['layout/getSpecificLayoutName']
  }

  get currentUser (): AppUser | null {
    return this.$typedState.auth.currentUser
  }

  get currentBreakpoint () {
    return vuetify.framework.breakpoint.name
  }

  handleSetDefaultLayout () {
    this.$typedDispatch('layout/onLayoutChange', {
      name: 'dashboard',
      value: this.$typedGetters['layout/getLayout'](this.currentLayoutName)!
    })
  }

  handleResetDefaultLayout () {
    this.$typedDispatch('layout/onLayoutChange', {
      name: 'dashboard',
      value: defaultState().layouts.dashboard
    })
  }

  async handlePowerToggle () {
    const { type, device } = this.topNavPowerToggle || {}

    if (!device) return

    const confirmOnPowerDeviceChange: boolean = this.$typedState.config.uiSettings.general.confirmOnPowerDeviceChange

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
          SocketActions.machineDevicePowerSetDevice(device.device, state)
          break
        }

        case 'klipper': {
          const value = (device.value !== 0) ? 0 : device.scale
          this.sendGcode(`SET_PIN PIN=${encodeGcodeParamValue(device.name)} VALUE=${value}`, `${this.$waits.onSetOutputPin}${device.name}`)
          break
        }
      }
    }
  }

  handleUploadAndPrint (file: File) {
    this.uploadFile(file, '/', 'gcodes', true)
  }

  saveConfigAndRestart (force = false) {
    if (!force) {
      const confirmOnSaveConfigAndRestart: boolean = this.$typedState.config.uiSettings.general.confirmOnSaveConfigAndRestart

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

  .toolbar-logo {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 56px;
    height: inherit;
  }

  .theme--dark .toolbar-logo {
    border-right: thin solid rgba(map-get($shades, 'white'), 0.12);
    background-color: #28282b;
  }

  .theme--light .toolbar-logo {
    border-right: thin solid rgba(map-get($shades, 'black'), 0.12);
    background-color: #FFFFFF;
  }

  .toolbar-title {
    display: flex;
    flex: 1 1;
    max-width: 50%;
    height: inherit;
    align-items: center;
    padding-left: 16px;
  }

  .toolbar-supplemental {
    display: flex;
    justify-content: flex-end;
    flex: 0 0 50%;
    max-width: 50%;
    align-items: center;
    height: inherit;
  }

  .printer-title {
    font-size: 1.25rem;
    font-weight: 300;
    font-family: raleway, sans-serif;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    @media #{map-get($display-breakpoints, 'sm-and-up')} {
      font-size: 1.875rem;
    }
  }

  .printer-title > a {
    color: inherit;
    text-decoration: none;
  }

  .v-toolbar--extended :deep(.v-toolbar__content) {
    box-shadow: 0px 2px 4px -1px rgb(0 0 0 / 20%), 0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%);
  }

  :deep(.v-toolbar__extension) {
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  :deep(.v-toolbar__content) {
    padding-left: 0;
  }

  .v-btn.v-btn--disabled.v-btn--has-bg.bg-transparent {
    background: none !important;
  }
</style>
