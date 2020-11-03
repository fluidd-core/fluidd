<template>
  <v-app-bar
    app
    clipped-left
  >
    <v-container fluid class="constrained-width pa-0 fill-height">
      <v-img
        alt="Fluidd"
        class="shrink mr-4"
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
        <v-btn text to="/" class="d-none d-md-flex">
          <v-icon small class="mr-md-1">$home</v-icon>
          <span>Dashboard</span>
        </v-btn>
        <v-btn text to="/jobs" class="d-none d-md-flex">
          <v-icon small class="mr-md-1">$files</v-icon>
          <span>Jobs</span>
        </v-btn>
        <v-btn text to="/configuration" class="d-none d-md-flex">
          <v-icon small class="mr-md-1">$tune</v-icon>
          <span>Printer</span>
        </v-btn>
        <v-btn text to="/settings" class="d-none d-md-flex">
          <v-icon small class="mr-md-1">$cog</v-icon>
          <span>Settings</span>
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

        <v-menu bottom left offset-y :min-width="150" v-model="menu">
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              text
              min-width="54">
              <v-icon>$menu</v-icon>
            </v-btn>
          </template>

          <v-card color="secondary">

            <v-list nav dense color="secondary" class="d-block d-md-none">
              <v-list-item to="/">
                <v-list-item-icon>
                  <v-icon>$home</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Dashboard</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item to="/jobs">
                <v-list-item-icon>
                  <v-icon>$files</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Jobs</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item to="/configuration">
                <v-list-item-icon>
                  <v-icon>$tune</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Printer Configuration</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item to="/settings">
                <v-list-item-icon>
                  <v-icon>$cog</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>UI Settings</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>

            <v-divider class="d-block d-md-none"></v-divider>

            <system-commands-widget></system-commands-widget>
          </v-card>
        </v-menu>

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
