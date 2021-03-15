<template>
  <collapsable-card
    title="Printer Logs"
    icon="$download">
    <v-card-text>
      <btn block color="secondary" @click="getKlippyLog()" class="me-2 mb-2"><v-icon left small>$download</v-icon> Klippy.log</btn>
      <btn block color="secondary" @click="getMoonrakerLog()" class="me-2 mb-2"><v-icon left small>$download</v-icon>Moonraker.log</btn>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FilesMixin from '@/mixins/files'

@Component({})
export default class LogsCard extends Mixins(FilesMixin) {
  getKlippyLog () {
    this.downloadFile('klippy.log', '')
  }

  getMoonrakerLog () {
    this.downloadFile('moonraker.log', '')
  }
}
</script>
