<template>
  <v-app-bar
    color="#1E1E20"
    app
    height="60"
    extension-height="46"
  >
    <div class="toolbar-title">
      <v-toolbar-title class="printer-title text--secondary">
        <router-link to="/" v-html="instanceName"></router-link>
      </v-toolbar-title>
    </div>

    <v-spacer />

    <div class="toolbar-supplemental">
      <v-tooltip bottom v-if="socketConnected && !isMobile && authenticated">
        <template v-slot:activator="{ on, attrs }">
          <app-btn
            v-if="!isMobile"
            :disabled="!klippyReady"
            v-bind="attrs"
            v-on="on"
            fab
            small
            class="mx-1"
            color="transparent"
            :elevation="0"
            @click="emergencyStop()"
          >
            <v-icon color="error">$estop</v-icon>
          </app-btn>
        </template>
        {{ $t('app.general.tooltip.estop') }}
      </v-tooltip>

      <app-notification-menu v-if="authenticated && socketConnected"></app-notification-menu>

      <app-user-menu
        v-if="supportsAuth && authenticated"
        @change-password="dialog = true"
      ></app-user-menu>

      <app-btn
        fab
        small
        :elevation="0"
        class="mx-1"
        color="transparent"
        @click="$emit('toolsdrawer')"
      >
        <v-icon>$menu</v-icon>
      </app-btn>

    </div>

    <template v-slot:extension v-if="inLayout">
      <app-btn
        @click.stop="handleExitLayout"
        small
        class="mx-2"
        color="primary"
        v-html="$t('app.general.btn.exit_layout')"
      >
      </app-btn>
      <app-btn
        @click.stop="handleResetLayout"
        small
        class="mx-2"
        color="primary"
        v-html="$t('app.general.btn.reset_layout')"
      >
      </app-btn>
    </template>

    <user-password-dialog
      v-model="dialog">
    </user-password-dialog>

  </v-app-bar>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UserPasswordDialog from '@/components/settings/auth/UserPasswordDialog.vue'
import { defaultState } from '@/store/layout/index'
import StateMixin from '@/mixins/state'

@Component({
  components: {
    UserPasswordDialog
  }
})
export default class AppBar extends Mixins(StateMixin) {
  menu = false
  dialog = false

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

  get theme () {
    return this.$store.getters['config/getTheme']
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
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
}
</script>

<style lang="scss" scoped>
  .toolbar-title,
  .toolbar-nav,
  .toolbar-supplemental {
    display: flex;
    flex: 0 0 50%;
    max-width: 50%;
    align-items: center;
    height: inherit;
    @media #{map-get($display-breakpoints, 'md-and-up')} {
      flex: 0 0 50%;
      max-width: 50%;
    }
  }

  .toolbar-supplemental {
    justify-content: flex-end;
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

  .v-toolbar--extended ::v-deep .v-toolbar__content {
    box-shadow: 0px 2px 4px -1px rgb(0 0 0 / 20%), 0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%);
  }

  ::v-deep .v-toolbar__extension {
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
</style>
