<template>
  <collapsable-card
    :title="`Klippy: ${klippyState}`"
    :collapsable="false"
    icon="$alert">
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="4">
          <v-btn v-if="!klipperConnected" block color="warning" @click="serviceRestartKlipper" class="me-2 mb-2">Restart Klipper Service</v-btn>
          <v-btn v-if="klipperConnected" block color="warning" @click="serviceRestartKlippy" class="me-2 mb-2">Restart Klipper</v-btn>
          <v-btn v-if="klipperConnected" block color="warning" @click="serviceFirmwareRestartKlippy" class="me-2 mb-2">Firmware Restart</v-btn>
          <v-btn block color="warning" @click="serviceRestartMoonraker" class="me-2 mb-2">Restart Moonraker</v-btn>
          <v-btn block color="secondary" @click="getKlippyLog()" class="me-2 mb-2"><v-icon left small>$download</v-icon>Klippy.log</v-btn>
          <v-btn block color="secondary" @click="getMoonrakerLog()" class="me-2 mb-2"><v-icon left small>$download</v-icon>Moonraker.log</v-btn>
        </v-col>
        <v-col cols="12" sm="8">
          <v-alert text dense type="error" v-if="klippyStateMessage !== 'Printer is ready'">
            <span v-html=klippyStateMessage></span>
          </v-alert>
          <warnings-widget v-if="hasWarnings"></warnings-widget>
        </v-col>
      </v-row>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { SocketActions } from '@/socketActions'
import WarningsWidget from '@/components/widgets/WarningsWidget.vue'

@Component({
  components: {
    WarningsWidget
  }
})
export default class KlippyCard extends Mixins(UtilsMixin) {
  get klipperConnected () {
    return this.$store.state.socket.printer.serverInfo.klippy_connected
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

  serviceRestartMoonraker () {
    SocketActions.serverRestart()
    this.$emit('click')
  }

  serviceRestartKlipper () {
    SocketActions.machineServicesRestart('klipper')
    this.$emit('click')
  }
}
</script>
