<template>
  <v-app-bar
    app
    clipped-left
  >
    <v-container fluid class="constrained-width pa-0 fill-height">
      <v-img
        alt="Fluidd"
        class="shrink mr-4 d-none d-sm-inline"
        contain
        :src="require('@/assets/logo.svg')"
        transition="scale-transition"
        width="35"
        height="40"
      />
      <!-- <v-icon large color="#1970b5" class="d-none d-sm-inline">$printer3dNozzle</v-icon> -->
      <v-toolbar-title class="title text--secondary font-weight-light text-h4 mr-5 d-none d-sm-inline">
        {{ instanceName }}
      </v-toolbar-title>
      <v-spacer />
      <v-toolbar-items>
        <v-btn text to="/">
          <v-icon small class="mr-md-1">$home</v-icon>
          <span class="d-none d-md-inline">Dashboard</span>
        </v-btn>
        <v-btn text to="/jobs">
          <v-icon small class="mr-md-1">$files</v-icon>
          <span class="d-none d-md-inline">Jobs</span>
        </v-btn>
        <v-btn text to="/configuration">
          <v-icon small class="mr-md-1">$tune</v-icon>
          <span class="d-none d-md-inline">Printer</span>
        </v-btn>
        <v-btn text to="/settings">
          <v-icon small class="mr-md-1">$cog</v-icon>
          <span class="d-none d-md-inline">Settings</span>
        </v-btn>
        <v-tooltip bottom v-if="socketConnected">
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              :disabled="!klippyConnected"
              text
              color="error"
              @click="emergencyStop()"
              v-bind="attrs"
              v-on="on">
              <v-icon>$estop</v-icon>
            </v-btn>
          </template>
          Emergency Stop
        </v-tooltip>
        <system-commands-widget></system-commands-widget>
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
  get instanceName () {
    return this.$store.state.config.fileConfig.general.instanceName
  }

  get currentFile () {
    return this.$store.state.socket.printer.print_stats.filename
  }

  // Watch currentfile and refresh its metadata to ensure
  // our status has the correct data.
  @Watch('currentFile')
  onCurrentFileChanged (val: string) {
    if (val && val.length > 0 && val !== 'standby') {
      SocketActions.serverFilesMetaData(val)
    } else {
      this.$store.commit('socket/resetCurrentFile')
    }
  }

  emergencyStop () {
    SocketActions.printerEmergencyStop()
  }
}
</script>

<style lang="scss" scoped>
  // .logo {
  //   margin-right: 12px;
  //   max-height: 40px;
  //   max-width: 40px;
  //   object-fit: contain;
  // }
</style>
