<template>
  <v-app>
    <!-- <v-navigation-drawer
      v-model="drawer"
      app
      clipped
    >
      <v-list dense>
        <v-list-item link to="/">
          <v-list-item-action>
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/settings">
          <v-list-item-action>
            <v-icon>mdi-cog</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/about">
          <v-list-item-action>
            <v-icon>mdi-cog</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>About</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer> -->

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
      <!-- <v-menu bottom :offset-y="true" v-if="printerConnected && klippyConnected">
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on" icon color="white"><v-icon>mdi-dots-vertical</v-icon></v-btn>
        </template>
        <v-list nav dense transition="slide-y-transition" width="250">
          <v-list-item to="/">
            <v-list-item-icon>
              <v-icon>mdi-home</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Home</v-list-item-title>
          </v-list-item>
          <v-list-item to="/configuration">
            <v-list-item-icon>
              <v-icon>mdi-cog</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Configuration</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu> -->
      <!-- <v-btn icon color="white" to="/settings"><v-icon>mdi-dots-vertical</v-icon></v-btn> -->
    </v-app-bar>

    <v-main>
      <router-view v-if="printerConnected && klippyConnected" />
      <v-container style="height: 400px;" v-if="!printerConnected || !klippyConnected">
      <v-row
        class="fill-height"
        align-content="center"
        justify="center"
      >
        <v-col
          class="subtitle-1 text-center"
          cols="12"
          v-if="!printerConnected"
        >
          Connecting to printer...
        </v-col>
        <v-col cols="6" v-if="!klippyConnected">
          <v-alert type="error" v-if="!klippyConnected">
            Klippy has disconnected or is shutdown.<br />
            <span v-html=klippyError></span>
          </v-alert>
          <v-btn block color="warning" @click="sendGcode('FIRMWARE_RESTART')" class="me-2 mb-2">Firmware Restart</v-btn>
        </v-col>
        <v-col cols="6" v-if="!printerConnected">
          <v-progress-linear
            color="warning"
            indeterminate
            rounded
            height="6"
          ></v-progress-linear>
        </v-col>
      </v-row>
    </v-container>
    </v-main>

    <v-footer app>
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import UtilsMixin from './mixins/utils'
import { SocketActions } from './socketActions'

@Component({
  components: {}
})
export default class App extends Mixins(UtilsMixin) {
  get printerConnected () {
    return this.$store.getters['socket/getConnectionState']
  }

  get klippyState () {
    return this.$store.state.socket.printer.info.state
  }

  get klippyError () {
    const message = this.$store.state.socket.printer.info.state_message
    if (message) {
      return message.replace(/(?:\r\n|\r|\n)/g, '<br />')
    }
    return ''
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

  get unsavedChanges () {
    return this.$store.state.config.unsavedChanges
  }

  @Watch('currentFile')
  onCurrentFileChanged (val: string) {
    if (val && val.length > 0) {
      SocketActions.serverFilesMetaData(val)
    }
  }

  emergencyStop () {
    SocketActions.printerEmergencyStop()
  }

  created () {
    this.$vuetify.theme.dark = true
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
