<template>
  <v-card-text>
    <v-row>
      <v-col>
        <v-btn block color="warning" :disabled="printerBusy" @click="sendGcode('RESTART')" class="me-2 mb-2">Restart</v-btn>
        <v-btn block color="warning" :disabled="printerBusy" @click="sendGcode('FIRMWARE_RESTART')" class="me-2 mb-2">Firmware Restart</v-btn>
      </v-col>
      <v-col>
        <v-btn block color="error" :disabled="printerBusy" @click="sendGcode('HOST_REBOOT')" class="me-2 mb-2">Host Reboot</v-btn>
        <v-btn block color="error" :disabled="printerBusy" @click="sendGcode('HOST_RESTART')" class="me-2 mb-2">Host Shutdown</v-btn>
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({})
export default class SystemCommandsWidget extends Mixins(UtilsMixin) {}
</script>
