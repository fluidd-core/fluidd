<template>
  <v-card color="tertiary">
    <v-card-title class="quaternary font-weight-light">
      <v-icon left>{{ icons.alert }}</v-icon> Klippy Error
    </v-card-title>
    <v-card-subtitle class="quaternary">Klippy has disconnected or is shutdown.</v-card-subtitle>
    <v-divider></v-divider>
    <v-card-text>
      <v-row>
        <v-col class="subtitle-1">
          <p>Adjust your printer configuration using the edit tools to your right, then restart
            your firmware.
          </p>
          <v-alert text type="error">
            <span v-html=klippyError></span>
          </v-alert>
        </v-col>
        <v-col cols="3">
          <v-btn block color="secondary" @click="sendGcode('RESTART')" class="me-2 mb-2"><v-icon left small>{{ icons.download }}</v-icon> Klippy.log</v-btn>
          <v-btn block color="secondary" @click="sendGcode('FIRMWARE_RESTART')" class="me-2 mb-2"><v-icon left small>{{ icons.download }}</v-icon>Moonraker.log</v-btn>
        </v-col>
        <v-col cols="3">
          <v-btn block color="warning" @click="sendGcode('RESTART')" class="me-2 mb-2">Restart</v-btn>
          <v-btn block color="warning" @click="sendGcode('FIRMWARE_RESTART')" class="me-2 mb-2">Firmware Restart</v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class KlippyDisconnectedWidget extends Mixins(UtilsMixin) {
  get klippyError () {
    const message = this.$store.state.socket.printer.info.state_message
    if (message) {
      return message.replace(/(?:\r\n|\r|\n)/g, '<br />')
    }
    return ''
  }

  reload () {
    window.location.reload()
  }
}
</script>
