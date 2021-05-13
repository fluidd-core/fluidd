<template>
  <v-app-bar
    app
    clipped-left
  >
    <div class="toolbar-title">
      <router-link to="/">
        <app-icon
          class="shrink mr-3 color-filter float-left"
          width="30"
          :primary-color="theme.currentTheme.primary"
          :secondary-color="theme.currentTheme.primaryOffset"
        ></app-icon>
      </router-link>
      <v-toolbar-title class="printer-title text--secondary">
        <router-link to="/" v-html="instanceName"></router-link>
      </v-toolbar-title>
    </div>

    <div class="toolbar-nav">
      <app-nav-item
        icon="$home"
        exact
        to="/">
        {{ $t('app.general.title.home') }}
      </app-nav-item>

      <app-nav-item
        icon="$files"
        to="/jobs">
        {{ $t('app.general.title.jobs') }}
      </app-nav-item>

      <app-nav-item
        v-if="supportsHistory"
        icon="$history"
        to="/history">
        {{ $t('app.general.title.history') }}
      </app-nav-item>

      <app-nav-item
        icon="$tune"
        to="/tune">
        {{ $t('app.general.title.tune') }}
      </app-nav-item>

      <app-nav-item
        icon="$cogs"
        to="/configure">
        {{ $t('app.general.title.configure') }}
      </app-nav-item>
    </div>

    <div class="toolbar-suplimental">
      <v-tooltip bottom v-if="socketConnected && !isMobile">
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

      <app-notification-menu></app-notification-menu>

      <app-btn
        v-if="!isMobile"
        fab
        small
        :elevation="0"
        class="mx-1"
        color="transparent"
        :to="{ path: '/settings' }"
      >
        <v-icon>$cog</v-icon>
      </app-btn>

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

  </v-app-bar>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class AppBar extends Mixins(StateMixin) {
  menu = false

  get supportsHistory () {
    return this.$store.getters['server/componentSupport']('history')
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
}
</script>

<style lang="scss" scoped>
  .toolbar-title,
  .toolbar-nav,
  .toolbar-suplimental {
    display: flex;
    flex: 0 0 50%;
    max-width: 50%;
    align-items: center;
    height: inherit;
    @media #{map-get($display-breakpoints, 'md-and-up')} {
      flex: 0 0 33.3333333333%;
      max-width: 33.3333333333%;
    }
  }

  .toolbar-nav {
    justify-content: center;
    @media #{map-get($display-breakpoints, 'sm-and-down')} {
      display: none;
    }
  }

  .toolbar-suplimental {
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
</style>
