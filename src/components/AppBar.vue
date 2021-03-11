<template>
  <v-app-bar
    app
    clipped-right
  >
    <v-container fluid class="flex-nowrap constrained-width pa-0 fill-height">
      <router-link to="/">
        <fluidd-icon
          class="shrink mr-4 mt-1 color-filter"
          width="35"
          height="40"
          :primary-color="theme.currentTheme.primary"
          :secondary-color="theme.currentTheme.primaryOffset"
        ></fluidd-icon>
      </router-link>
      <v-toolbar-title
        class="printer-title text--secondary mr-5"
      >
        <router-link to="/" v-html="instanceName"></router-link>
      </v-toolbar-title>
      <v-spacer />

      <btn text to="/" class="d-none d-md-flex mx-1">
        <v-icon small class="mr-md-1">$home</v-icon>
        <span>Dashboard</span>
      </btn>
      <btn text to="/jobs" class="d-none d-md-flex mx-1" :disabled="!jobsAvailable">
        <v-icon small class="mr-md-1">$files</v-icon>
        <span>Jobs</span>
      </btn>
      <btn text to="/configuration" class="d-none d-md-flex mx-1">
        <v-icon small class="mr-md-1">$tune</v-icon>
        <span>Printer</span>
      </btn>
      <v-tooltip bottom v-if="socketConnected">
        <template v-slot:activator="{ on, attrs }">
          <btn
            :disabled="!klippyReady"
            icon
            color="error"
            @click="emergencyStop()"
            v-bind="attrs"
            v-on="on">
            <v-icon>$estop</v-icon>
          </btn>
        </template>
        Emergency Stop
      </v-tooltip>

      <v-badge
        bordered
        color="warning"
        dot
        overlap
        :value="hasUpdates"
        :offset-y="15"
        :offset-x="15"
      >
        <btn icon @click="$emit('drawer')">
          <v-icon>$menu</v-icon>
        </btn>
      </v-badge>

    </v-container>
  </v-app-bar>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/socketActions'
import SystemCommandsWidget from '@/components/widgets/SystemCommandsWidget.vue'

@Component({
  components: {
    SystemCommandsWidget
  }
})
export default class AppBar extends Mixins(StateMixin) {
  menu = false

  get jobsAvailable () {
    return this.$store.getters['files/isRootAvailable']('gcodes')
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

  hasUpdate (component: 'klipper' | 'moonraker' | 'client') {
    return this.$store.getters['version/hasUpdate'](component)
  }

  emergencyStop () {
    SocketActions.printerEmergencyStop()
  }
}
</script>

<style lang="scss" scoped>
  .fill1 {
    fill: #2E75AE;
  }

  .fill2 {
    fill: #2196F3;
  }

  .printer-title {
    font-size: 1.25rem;
    font-weight: 300;
    font-family: raleway, sans-serif;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    @media #{map-get($display-breakpoints, 'sm-and-up')} {
      font-size: 2.125rem;
    }
  }

  .printer-title > a {
    color: inherit;
    text-decoration: none;
  }
</style>
