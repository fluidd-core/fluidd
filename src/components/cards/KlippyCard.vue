<template>
  <collapsable-card
    :title="$t('printer.status.klippy.title',{klippyState})"
    :collapsable="false"
    icon="$alert"
    icon-color="error">
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="auto">
          <btn v-if="!klippyConnected" block color="primary" @click="serviceRestartKlipper" class="me-2 mb-2">{{$t('printer.status.klippy.restart.klippy')}}</btn>
          <btn v-if="klippyConnected" block color="primary" @click="restartKlippy" class="me-2 mb-2">{{$t('printer.status.klippy.restart.klippy')}}</btn>
          <btn v-if="klippyConnected" block color="primary" @click="firmwareRestartKlippy" class="me-2 mb-2">{{$t('printer.status.klippy.restart.service')}}</btn>
          <btn block color="secondary" @click="getKlippyLog()" class="me-2 mb-2"><v-icon left small>$download</v-icon>Klippy.log</btn>
          <btn block color="secondary" @click="getMoonrakerLog()" class="me-2 mb-2"><v-icon left small>$download</v-icon>Moonraker.log</btn>
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
import ServicesMixin from '@/mixins/services'
import WarningsWidget from '@/components/widgets/WarningsWidget.vue'

@Component({
  components: {
    WarningsWidget
  }
})
export default class KlippyCard extends Mixins(StateMixin, ServicesMixin) {
  get klipperConnected () {
    return this.$store.getters['server/getInfo'].klippy_connected
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
