<template>
  <v-app-bar
    app
    clipped-left
    extension-height="46"
    :color="theme.currentTheme.appbar"
    :height="$globals.HEADER_HEIGHT"
  >
    <router-link
      v-show="!isMobileViewport"
      to="/"
      class="toolbar-logo"
    >
      <app-icon />
    </router-link>

    <div class="toolbar-title">
      <app-btn
        v-if="isMobileViewport"
        fab
        small
        :elevation="0"
        class="mx-1"
        color="transparent"
        @click="$emit('navdrawer')"
      >
        <v-icon>$menuAlt</v-icon>
      </app-btn>

      <v-toolbar-title class="printer-title text--secondary">
        <router-link
          to="/"
          v-html="instanceName"
        />
      </v-toolbar-title>
    </div>

    <!-- <v-spacer /> -->

    <div class="toolbar-supplemental">
      <div
        v-if="socketConnected && klippyReady && authenticated && showSaveConfigAndRestart && saveConfigPending"
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
          <span>{{ $t('app.general.tooltip.estop') }}</span>
        </v-tooltip>
      </div>

      <div v-if="authenticated && socketConnected && showUploadAndPrint">
        <app-upload-and-print-btn
          :disabled="printerPrinting || printerPaused || !klippyReady"
          @upload="handleUploadAndPrint"
        />
      </div>

      <div v-if="authenticated && socketConnected && topNavPowerToggle">
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <app-btn
              fab
              small
              :elevation="0"
              class="mr-1 bg-transparent"
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
        class="mr-1"
      >
        <app-notification-menu />
      </div>

      <div
        v-if="supportsAuth && authenticated"
        class="mr-1"
      >
        <app-user-menu @change-password="userPasswordDialogOpen = true" />
      </div>

      <app-btn
        fab
        small
        :elevation="0"
        class="mr-1"
        color="transparent"
        @click="$emit('toolsdrawer')"
      >
        <v-icon>$menu</v-icon>
      </app-btn>
    </div>

    <template
      v-if="inLayout"
      #extension
    >
      <app-btn
        small
        class="mx-2"
        color="primary"
        @click.stop="handleExitLayout"
      >
        {{ $t('app.general.btn.exit_layout') }}
      </app-btn>
      <app-btn
        small
        class="mx-2"
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
          class="mx-2"
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
import { OutputPin } from '@/store/printer/types'
import { Device } from '@/store/power/types'

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

  get supportsAuth () {
    return this.$store.getters['server/componentSupport']('authorization')
  }

  get instances () {
    return this.$store.state.config.instances
  }

  get instanceName () {
    return this.$store.state.config.uiSettings.general.instanceName
  }

  get currentFile () {
    return this.$store.state.printer.printer.print_stats.filename
  }

  get hasUpdates () {
    return this.$store.getters['version/hasUpdates']
  }

  get saveConfigPending () {
    return this.$store.getters['printer/getSaveConfigPending']
  }

  get devicePowerComponentEnabled () {
    return this.$store.getters['server/componentSupport']('power')
  }

  get theme () {
    return this.$store.getters['config/getTheme']
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  get showSaveConfigAndRestart (): boolean {
    return this.$store.state.config.uiSettings.general.showSaveConfigAndRestart
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
        const devices = this.$store.state.power.devices as Device[]
        const device = devices.find(device => device.device === topNavPowerToggle)
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

  handleExitLayout () {
    this.$store.commit('config/setLayoutMode', false)
  }

  get isDashboard () {
    return this.$route.path === '/'
  }

  handleResetLayout () {
    const pathLayouts: Record<string, string> = {
      '/diagnostics': 'diagnostics'
    }

    const pathLayout = pathLayouts[this.$route.path]
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
    let res: boolean | undefined = true
    if (confirmOnPowerDeviceChange) {
      res = await this.$confirm(
        this.$tc('app.general.simple_form.msg.confirm_power_device_toggle'),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
      )
    }

    if (res) {
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

  handleUploadAndPrint (file: File) {
    this.uploadFile(file, '/', 'gcodes', true)
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
