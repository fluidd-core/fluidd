<template>
  <v-navigation-drawer
    v-model="open"
    :color="$vuetify.theme.currentTheme.drawer"
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
        :color="$vuetify.theme.currentTheme.drawer"
        mini-variant
        :value="open"
        class="pb-16 pb-sm-0"
      >
        <div
          v-if="isMobileViewport"
          :style="`height: ${$globals.HEADER_HEIGHT}px;`"
          class="app-icon"
        >
          <router-link :to="{ name: 'home' }">
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
            to="home"
          >
            {{ $t('app.general.title.home') }}
          </app-nav-item>

          <app-nav-item
            icon="$console"
            to="console"
          >
            {{ $t('app.general.title.console') }}
          </app-nav-item>

          <app-nav-item
            icon="$cubeScan"
            to="gcode_preview"
          >
            {{ $t('app.general.title.gcode_preview') }}
          </app-nav-item>

          <app-nav-item
            icon="$files"
            to="jobs"
          >
            {{ $t('app.general.title.jobs') }}
          </app-nav-item>

          <app-nav-item
            v-if="supportsHistory"
            icon="$history"
            to="history"
          >
            {{ $t('app.general.title.history') }}
          </app-nav-item>

          <app-nav-item
            v-if="supportsTimelapse"
            icon="$video"
            to="timelapse"
          >
            {{ $t('app.general.title.timelapse') }}
          </app-nav-item>

          <app-nav-item
            icon="$tune"
            to="tune"
          >
            {{ $t('app.general.title.tune') }}
          </app-nav-item>

          <app-nav-item
            v-if="enableDiagnostics"
            icon="$chart"
            to="diagnostics"
          >
            {{ $t('app.general.title.diagnostics') }}
          </app-nav-item>

          <app-nav-item
            icon="$codeJson"
            to="configure"
          >
            {{ $t('app.general.title.configure') }}
          </app-nav-item>

          <app-nav-item
            icon="$desktopTower"
            to="system"
          >
            {{ $t('app.general.title.system') }}
          </app-nav-item>

          <app-nav-item
            icon="$cog"
            to="settings"
          >
            {{ $t('app.general.title.settings') }}
          </app-nav-item>
        </div>

        <template
          v-if="!isMobileViewport && canEditLayout"
          #append
        >
          <v-tooltip right>
            <template #activator="{ attrs, on }">
              <app-btn
                icon
                large
                :color="layoutMode ? 'primary' : undefined"
                style="margin: 6px"
                v-bind="attrs"
                v-on="on"
                @click="layoutMode = !layoutMode"
              >
                <v-icon>$apps</v-icon>
              </app-btn>
            </template>
            <span>
              {{ $t('app.general.btn.adjust_layout') }}
            </span>
          </v-tooltip>
        </template>
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
import BrowserMixin from '@/mixins/browser'

@Component({})
export default class AppNavDrawer extends Mixins(StateMixin, BrowserMixin) {
  @VModel({ type: Boolean })
  open?: boolean

  get supportsHistory (): boolean {
    return this.$store.getters['server/componentSupport']('history')
  }

  get supportsTimelapse (): boolean {
    return this.$store.getters['server/componentSupport']('timelapse')
  }

  get enableDiagnostics (): boolean {
    return this.$store.state.config.uiSettings.general.enableDiagnostics
  }

  get hasSubNavigation () {
    return this.$route.meta?.hasSubNavigation ?? false
  }

  get showSubNavigation () {
    return this.hasSubNavigation && this.socketConnected && this.authenticated
  }

  get canEditLayout () {
    return this.$route.meta?.dashboard ?? false
  }

  get layoutMode (): boolean {
    return this.$store.state.config.layoutMode
  }

  set layoutMode (val: boolean) {
    this.$store.commit('config/setLayoutMode', val)
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
