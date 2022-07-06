<template>
  <v-app-bar
    app
    clipped-left
    extension-height="46"
    :color="theme.currentTheme.appbar"
    :height="$globals.HEADER_HEIGHT"
  >
    <router-link
      v-show="!isMobile"
      to="/"
      class="toolbar-logo"
    >
      <app-icon />
    </router-link>

    <div class="toolbar-title">
      <app-btn
        v-if="isMobile"
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
        v-if="socketConnected && klippyReady && authenticated && saveConfigPending"
        class="mr-1"
      >
        <app-save-config-and-restart-btn
          :loading="hasWait(waits.onSaveConfig)"
          :disabled="printerPrinting"
          @click="saveConfigAndRestart"
        />
      </div>

      <div v-if="socketConnected && !isMobile && authenticated">
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

      <div
        v-if="authenticated && socketConnected && shutdownOnAppBar"
      >
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <app-btn
              v-bind="attrs"
              class="mx-1"
              depressed
              color="transparent"
              v-on="on"
              @click="handleHostShutdown()"
            >
              <v-icon color="primary">
                $power
              </v-icon>
            </app-btn>
          </template>
          <span>{{ $t('app.general.btn.shutdown') }} ({{ $t('app.general.label.host') }})</span>
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
        v-html="$t('app.general.btn.exit_layout')"
      />
      <app-btn
        small
        class="mx-2"
        color="primary"
        @click.stop="handleResetLayout"
        v-html="$t('app.general.btn.reset_layout')"
      />
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
import { defaultState } from '@/store/layout/index'
import StateMixin from '@/mixins/state'
import ServicesMixin from '@/mixins/services'

@Component({
  components: {
    UserPasswordDialog,
    PendingChangesDialog,
    AppSaveConfigAndRestartBtn
  }
})
export default class AppBar extends Mixins(StateMixin, ServicesMixin) {
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

  get theme () {
    return this.$store.getters['config/getTheme']
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  get shutdownOnAppBar (): boolean {
    return (this.$store.state.config.uiSettings.general.shutdownOnAppBar)
  }

  handleExitLayout () {
    this.$store.commit('config/setLayoutMode', false)
  }

  handleResetLayout () {
    const layout = defaultState()
    this.$store.dispatch('layout/onLayoutChange', {
      name: 'dashboard',
      value: {
        container1: layout.layouts.dashboard.container1,
        container2: layout.layouts.dashboard.container2
      }
    })
  }

  async handleHostShutdown () {
    const res = await this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_shutdown_host'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (res) {
      this.hostShutdown()
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

    this.sendGcode('SAVE_CONFIG', this.waits.onSaveConfig)
  }
}
</script>

<style lang="scss" scoped>
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
</style>
