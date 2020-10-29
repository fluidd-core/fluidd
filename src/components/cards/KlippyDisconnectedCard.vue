<template>
  <collapsable-card
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
          <v-alert text type="error">
            <span v-html=klippyStateMessage></span>
          </v-alert>
        </v-col>
      </v-row>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class KlippyDisconnectedCard extends Mixins(UtilsMixin) {
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
