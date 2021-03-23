<template>
  <collapsable-card
    :title="$t('app.general.title.logs')"
    icon="$download">
    <v-card-text>
      <btn block @click="getKlippyLog()" class="me-2 mb-2"><v-icon left small>$download</v-icon> klippy.log</btn>
      <btn block @click="getMoonrakerLog()" class="me-2 mb-2"><v-icon left small>$download</v-icon>moonraker.log</btn>
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
