<template>
  <v-app-bar
    app
    clipped-right
  >
    <v-container fluid class="flex-nowrap constrained-width pa-0 fill-height">
      <router-link to="/">
        <v-img
          alt="Fluidd"
          class="shrink mr-4"
          contain
          :src="require('@/assets/logo.svg')"
          transition="scale-transition"
          width="35"
          height="40"
        />
      </router-link>
      <v-toolbar-title
        class="printer-title text--secondary font-weight-light text-h4 mr-5"
      >
        <router-link to="/">
          {{ instanceName }}
        </router-link>
      </v-toolbar-title>
      <v-spacer />
      <v-toolbar-items>
        <v-btn text to="/" class="d-none d-md-flex">
          <v-icon small class="mr-md-1">$home</v-icon>
          <span>Dashboard</span>
        </v-btn>
        <v-btn text to="/jobs" class="d-none d-md-flex" v-if="jobsInMenu">
          <v-icon small class="mr-md-1">$files</v-icon>
          <span>Jobs</span>
        </v-btn>
        <v-btn text to="/configuration" class="d-none d-md-flex">
          <v-icon small class="mr-md-1">$tune</v-icon>
          <span>Printer</span>
        </v-btn>
        <v-tooltip bottom v-if="socketConnected">
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              :disabled="!klippyConnected"
              icon
              color="error"
              @click="emergencyStop()"
              v-bind="attrs"
              v-on="on">
              <v-icon>$estop</v-icon>
            </v-btn>
          </template>
          Emergency Stop
        </v-tooltip>

        <v-btn icon @click="$emit('drawer')">
          <v-icon>$menu</v-icon>
        </v-btn>
      </v-toolbar-items>

    </v-container>
  </v-app-bar>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { SocketActions } from '@/socketActions'
import SystemCommandsWidget from '@/components/widgets/SystemCommandsWidget.vue'

@Component({
  components: {
    SystemCommandsWidget
  }
})
export default class AppBar extends Mixins(UtilsMixin) {
  menu = false

  get instances () {
    return this.$store.state.config.instances
  }

  get instanceName () {
    return this.$store.state.config.fileConfig.general.instanceName
  }

  get currentFile () {
    return this.$store.state.socket.printer.print_stats.filename
  }

  get jobsInMenu () {
    return this.$store.state.config.fileConfig.general.jobsInMenu
  }

  // Watch currentfile and refresh its metadata to ensure
  // our status has the correct data.
  @Watch('currentFile')
  onCurrentFileChanged (val: string) {
    if (val && val.length > 0 && val !== 'standby') {
      // Print has started, refresh the meta data.
      // Note, this may fail if users are uploading via slicer and have the 'Start Immediately'
      // option set - because the metadata may have not been parsed.
      SocketActions.serverFilesMetaData(val)
    } else {
      // Print has stop or the file is cleared.
      this.$store.commit('socket/resetCurrentFile')
    }
  }

  emergencyStop () {
    SocketActions.printerEmergencyStop()
  }
}
</script>

<style lang="scss" scoped>
  .printer-title {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .printer-title > a {
    color: inherit;
    text-decoration: none;
  }
</style>
