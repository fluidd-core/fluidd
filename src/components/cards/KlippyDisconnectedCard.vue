<template>
  <collapsable-card
    v-if="showCard"
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
          <v-btn block color="warning" @click="restartKlippy" class="me-2 mb-2">Restart</v-btn>
          <v-btn block color="warning" @click="firmwareRestartKlippy" class="me-2 mb-2">Firmware Restart</v-btn>
        </v-col>
        <v-col class="subtitle-1">
          <p>If required, you may adjust your printer configuration using the edit tools in <router-link to="/configuration">configuration</router-link> and firmware_restart.</p>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-alert text type="error" v-if="klippyStateMessage !== 'Printer is ready'">
            <span v-html=klippyStateMessage></span>
          </v-alert>
          <v-alert text type="error" v-if="socketReady && clientWarnings.length && klippyStateMessage === 'Printer is ready'">
            <div class="mb-3">
              Detected missing configuration required for smooth operation.
            </div>

            <div class="client-warning mb-2" v-for="(warning, index) in clientWarnings" :key="index" v-html="warning.message"></div>
          </v-alert>
        </v-col>
      </v-row>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { Globals } from '@/globals'

@Component({
  components: {}
})
export default class KlippyDisconnectedCard extends Mixins(UtilsMixin) {
  get showCard () {
    return (!this.klippyConnected || this.clientWarnings.length)
  }

  get socketReady () {
    return this.$store.state.socket.ready
  }

  // Return a list of warnings we deem necessary for
  // correct usage of the web client.
  get clientWarnings () {
    const config = this.$store.state.socket.printer.configfile.config
    const warnings = []
    if (config && !config.virtual_sdcard) {
      warnings.push({ message: '<code>[virtual_sd_card]</code> not defined. Please ensure this is configured and the correct path is set.' })
    }

    if (config && !config.pause_resume) {
      warnings.push({ message: '<code>[pause_resume]</code> not defined in config.' })
    }

    if (config && !config.display_status) {
      warnings.push({ message: '<code>[display_status]</code> not defined in config.' })
    }

    if (config && ('gcode_macro CANCEL_PRINT' in config === false)) {
      warnings.push({ message: '<code>CANCEL_PRINT</code> macro is required. Should ensure <code>CLEAR_PAUSE</code> and <code>SDCARD_RESET_FILE</code> is defined.' })
    }
    return warnings
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
}
</script>
