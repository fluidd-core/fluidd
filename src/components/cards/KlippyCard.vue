<template>
  <collapsable-card
    :title="`Klippy: ${klippyState}`"
    :collapsable="false"
    icon="$alert"
    icon-color="error">
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="auto">
          <system-control></system-control>
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
import SystemControl from '@/components/widgets/configuration/SystemControl.vue'

@Component({
  components: {
    WarningsWidget,
    SystemControl
  }
})
export default class KlippyCard extends Mixins(StateMixin, ServicesMixin, FilesMixin) {
}
</script>
