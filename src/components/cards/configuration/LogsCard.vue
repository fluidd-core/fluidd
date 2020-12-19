<template>
  <collapsable-card
    title="Printer Logs"
    icon="$download">
    <v-card-text>
      <v-btn block color="secondary" @click="getKlippyLog()" class="me-2 mb-2"><v-icon left small>$download</v-icon> Klippy.log</v-btn>
      <v-btn block color="secondary" @click="getMoonrakerLog()" class="me-2 mb-2"><v-icon left small>$download</v-icon>Moonraker.log</v-btn>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({})
export default class LogsCard extends Mixins(UtilsMixin) {
  getKlippyLog () {
    this.download('klippy.log', '')
  }

  getMoonrakerLog () {
    this.download('moonraker.log', '')
  }
}
</script>
