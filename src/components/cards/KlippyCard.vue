<template>
  <collapsable-card
    :title="`Klippy: ${klippyState}`"
    :collapsable="false"
    icon="$alert"
    icon-color="error">
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="auto">
          <btn v-if="!klippyConnected" block color="primary" @click="serviceRestartKlipper" class="me-2 mb-2">{{ $t('Restart Klipper') }}</btn>
          <btn v-if="klippyConnected" block color="primary" @click="restartKlippy" class="me-2 mb-2">{{ $t('Restart Klipper') }}</btn>
          <btn v-if="klippyConnected" block color="primary" @click="firmwareRestartKlippy" class="me-2 mb-2">{{ $t('Firmware Restart') }}</btn>
          <btn block @click="getKlippyLog()" class="me-2 mb-2"><v-icon left small>$download</v-icon>Klippy.log</btn>
          <btn block @click="getMoonrakerLog()" class="me-2 mb-2"><v-icon left small>$download</v-icon>Moonraker.log</btn>
        </v-col>
        <v-col cols="12" sm="">
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
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import ServicesMixin from '@/mixins/services'
import WarningsWidget from '@/components/widgets/WarningsWidget.vue'

@Component({
  components: {
    WarningsWidget
  }
})
export default class KlippyCard extends Mixins(StateMixin, ServicesMixin, FilesMixin) {
  getKlippyLog () {
    this.downloadFile('klippy.log', '')
  }

  getMoonrakerLog () {
    this.downloadFile('moonraker.log', '')
  }

  reload () {
    window.location.reload()
  }
}
</script>
