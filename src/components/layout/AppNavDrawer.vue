<template>
  <v-navigation-drawer
    v-model="open"
    :color="theme.currentTheme.drawer"
    :mini-variant="!showSubNavigation"
    :floating="!showSubNavigation"
    clipped
    app
  >
    <v-row
      class="fill-height"
      no-gutters
    >
      <v-navigation-drawer
        :color="theme.currentTheme.drawer"
        mini-variant
        :value="open"
      >
        <div
          v-show="isMobile"
          :style="`height: ${$globals.HEADER_HEIGHT}px;`"
          class="app-icon"
        >
          <router-link to="/">
            <app-icon />
          </router-link>
        </div>

        <div
          v-show="authenticated && socketConnected"
          class="nav-items"
        >
          <app-nav-item
            icon="$dash"
            exact
            to="/"
          >
            {{ $t('app.general.title.home') }}
          </app-nav-item>

          <app-nav-item
            icon="$console"
            to="/console"
          >
            {{ $t('app.general.title.console') }}
          </app-nav-item>

          <app-nav-item
            icon="$cubeScan"
            to="/preview"
          >
            {{ $t('app.general.title.gcode_preview') }}
          </app-nav-item>

          <app-nav-item
            icon="$files"
            to="/jobs"
          >
            {{ $t('app.general.title.jobs') }}
          </app-nav-item>

          <app-nav-item
            v-if="supportsHistory"
            icon="$history"
            to="/history"
          >
            {{ $t('app.general.title.history') }}
          </app-nav-item>

          <app-nav-item
            v-if="supportsTimelapse"
            icon="$video"
            to="/timelapse"
          >
            {{ $t('app.general.title.timelapse') }}
          </app-nav-item>

          <app-nav-item
            icon="$tune"
            to="/tune"
          >
            {{ $t('app.general.title.tune') }}
          </app-nav-item>

          <app-nav-item
            v-if="enableDiagnostics"
            icon="$chart"
            to="/diagnostics"
          >
            {{ $t('app.general.title.diagnostics') }}
          </app-nav-item>

          <app-nav-item
            icon="$codeJson"
            to="/configure"
          >
            {{ $t('app.general.title.configure') }}
          </app-nav-item>

          <app-nav-item
            icon="$desktopTower"
            to="/system"
          >
            {{ $t('app.general.title.system') }}
          </app-nav-item>

          <app-nav-item
            icon="$cog"
            to="/settings"
          >
            {{ $t('app.general.title.settings') }}
          </app-nav-item>
        </div>
      </v-navigation-drawer>

      <router-view
        v-if="showSubNavigation"
        name="navigation"
      />
    </v-row>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Mixins, VModel } from 'vue-property-decorator'

import StateMixin from '@/mixins/state'

@Component({})
export default class AppNavDrawer extends Mixins(StateMixin) {
  @VModel({ type: Boolean, default: true })
    open!: boolean

  get theme () {
    return this.$store.getters['config/getTheme']
  }

  get supportsHistory () {
    return this.$store.getters['server/componentSupport']('history')
  }

  get supportsTimelapse () {
    return this.$store.getters['server/componentSupport']('timelapse')
  }

  get supportsVersions () {
    return this.$store.getters['server/componentSupport']('update_manager')
  }

  get enableDiagnostics () {
    return this.$store.state.config.uiSettings.general.enableDiagnostics
  }

  get hasSubNavigation () {
    return this.$route.meta?.hasSubNavigation ?? false
  }

  get showSubNavigation () {
    return this.hasSubNavigation && this.socketConnected && this.authenticated
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}
</script>

<style lang="scss" scoped>
  .app-icon {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  :deep(.v-navigation-drawer.no-subnav > .v-navigation-drawer__border) {
     display: none;
  }
</style>
