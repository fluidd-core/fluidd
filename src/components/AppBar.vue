<template>
  <v-app-bar
    app
    clipped-left
  >
    <!-- <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon> -->
    <!-- <img src="./assets/logo.svg" class="logo" /> -->
    <v-icon large color="#1970b5">{{ icons.printer3dNozzle }}</v-icon>
    <v-toolbar-title class="title text-h4 mr-5 d-none d-sm-inline">
      Fluidd
    </v-toolbar-title>
    <v-spacer />
    <v-switch
      v-model="darkmode"
      label="dark mode"
      hide-details
      class="mr-5 d-none d-sm-block"
    ></v-switch>
    <v-toolbar-items>
      <v-btn text to="/">
        <v-icon small class="mr-md-1">{{ icons.home }}</v-icon>
        <span class="d-none d-md-inline">Dashboard</span>
      </v-btn>
      <v-btn text to="/configuration">
        <v-icon small class="mr-md-1">{{ icons.tune }}</v-icon>
        <span class="d-none d-md-inline">Configuration</span>
      </v-btn>
      <v-btn text to="/settings">
        <v-icon small class="mr-md-1">{{ icons.cog }}</v-icon>
        <span class="d-none d-md-inline">Settings</span>
      </v-btn>
      <v-tooltip bottom v-if="socketConnected && klippyConnected">
        <template v-slot:activator="{ on, attrs }">
          <v-btn text color="error" @click="emergencyStop()" v-bind="attrs" v-on="on"><v-icon>{{ icons.estop }}</v-icon></v-btn>
        </template>
        Emergency Stop
      </v-tooltip>
    </v-toolbar-items>
  </v-app-bar>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { SocketActions } from '@/socketActions'

@Component({
  components: {}
})
export default class AppBar extends Mixins(UtilsMixin) {
  get currentFile () {
    return this.$store.state.socket.printer.print_stats.filename
  }

  get darkmode () {
    return this.$store.state.config.localConfig.darkMode
  }

  set darkmode (val: boolean) {
    this.$vuetify.theme.dark = val
    this.$store.dispatch('config/saveLocalStorage', { darkMode: val })
  }

  // Watch currentfile and refresh its metadata to ensure
  // our status has the correct data.
  @Watch('currentFile')
  onCurrentFileChanged (val: string) {
    if (val && val.length > 0 && val !== 'standby') {
      SocketActions.serverFilesMetaData(val)
    }
  }

  emergencyStop () {
    SocketActions.printerEmergencyStop()
  }
}
</script>

<style lang="scss" scoped>
  .title {
    background: -webkit-linear-gradient(45deg, #1970b5, #9accf5);
    background-clip: text;
    -webkit-text-fill-color: transparent;}
  .logo {
    margin-right: 12px;
    max-height: 40px;
    max-width: 40px;
    object-fit: contain;
  }
</style>
