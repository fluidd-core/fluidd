<template>
  <v-container style="height: 400px;">
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
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class AppDisconnected extends Mixins(UtilsMixin) {
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

  get klippyError () {
    const message = this.$store.state.socket.printer.info.state_message
    if (message) {
      return message.replace(/(?:\r\n|\r|\n)/g, '<br />')
    }
    return ''
  }
}
</script>
