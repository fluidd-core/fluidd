<template>
  <v-app-bar
    app
    clipped-left
  >
    <!-- <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon> -->
    <!-- <img src="./assets/logo.svg" class="logo" /> -->
    <v-icon large color="#1970b5">mdi-printer-3d-nozzle</v-icon>
    <v-toolbar-title class="title text-h4">
      Fluidd
    </v-toolbar-title>
    <v-spacer />
    <v-btn color="secondary" class="mr-2" to="/"><v-icon small class="mr-2">mdi-home</v-icon> Dashboard</v-btn>
    <!-- <v-btn color="secondary" class="mr-2" to="/configuration"><v-icon small class="mr-2">mdi-tune</v-icon> Configuration</v-btn> -->
    <v-spacer />
    <v-tooltip bottom v-if="printerConnected && klippyConnected">
      <template v-slot:activator="{ on, attrs }">
        <v-btn @click="emergencyStop()" v-bind="attrs" v-on="on" icon color="error"><v-icon>mdi-car-brake-alert</v-icon></v-btn>
      </template>
      Emergency Stop
    </v-tooltip>
    <v-btn icon color="white" class="mr-2" to="/settings"><v-icon small>mdi-cog</v-icon></v-btn>
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
  get printerConnected () {
    return this.$store.getters['socket/getConnectionState']
  }

  get klippyState () {
    return this.$store.state.socket.printer.info.state
  }

  get klippyConnected () {
    if (this.klippyState !== 'ready') {
      return false
    }
    return true
  }

  get currentFile () {
    return this.$store.state.socket.printer.print_stats.filename
  }

  // Watch currentfile and refresh its metadata to ensure
  // our status has the correct data.
  @Watch('currentFile')
  oncurrentFileChanged (val: string) {
    if (val && val.length > 0) {
      SocketActions.serverFilesMetaData(val)
    }
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
