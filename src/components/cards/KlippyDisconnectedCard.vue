<template>
  <collapsable-card
    v-if="printerWarnings.length && !klippyConnected"
    :title="'Klippy: ' + klippyState"
    :collapsable="false"
    icon="$alert">
    <v-card-text>
      <v-row>
        <v-col cols="auto">
          <v-btn block color="secondary" @click="getKlippyLog()" class="me-2 mb-2"><v-icon left small>$download</v-icon> Klippy.log</v-btn>
          <v-btn block color="secondary" @click="getMoonrakerLog()" class="me-2 mb-2"><v-icon left small>$download</v-icon>Moonraker.log</v-btn>
        </v-col>
        <v-col cols="auto">
          <v-btn block color="warning" @click="serviceRestartKlippy" class="me-2 mb-2">Restart</v-btn>
          <v-btn block color="warning" @click="serviceFirmwareRestartKlippy" class="me-2 mb-2">Firmware Restart</v-btn>
        </v-col>
        <v-col class="subtitle-1">
          <p>If required, you may adjust your printer configuration using the edit tools in <router-link to="/configuration">configuration</router-link> and firmware_restart.</p>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-alert text dense type="error" v-if="klippyStateMessage !== 'Printer is ready'">
            <span v-html=klippyStateMessage></span>
          </v-alert>
          <v-alert text dense icon="$alert" type="warning" v-if="socketReady && clientWarnings.length && klippyStateMessage === 'Printer is ready'">
            <div class="mb-2">
              {{ appName }} warnings found
            </div>

            <!-- <div class="client-warning mb-2" v-for="(warning, index) in clientWarnings" :key="index" v-html="warning.message"></div> -->
            <div class="client-warning" v-for="(warning, index) in clientWarnings" :key="index" v-html="warning.message"></div>
          </v-alert>
        </v-col>
      </v-row>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { SocketActions } from '@/socketActions'
import { Globals } from '@/globals'

@Component({
  components: {}
})
export default class KlippyDisconnectedCard extends Mixins(UtilsMixin) {
  get socketReady () {
    return this.$store.state.socket.ready
  }

  get appName () {
    return Globals.APP_NAME
  }

  getKlippyLog () {
    this.download('klippy.log', '')
  }

  getMoonrakerLog () {
    this.download('moonraker.log', '')
  }

  reload () {
    window.location.reload()
  }

  serviceRestartKlippy () {
    SocketActions.printerRestart()
    this.$emit('click')
  }

  serviceFirmwareRestartKlippy () {
    SocketActions.printerFirmwareRestart()
    this.$emit('click')
  }
}
</script>
