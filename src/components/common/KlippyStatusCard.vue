<template>
  <collapsable-card
    :title="`Klippy: ${klippyState}`"
    icon="$error"
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
          <app-warnings v-if="hasWarnings"></app-warnings>
        </v-col>
      </v-row>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class KlippyStatusCard extends Mixins(StateMixin) {
}
</script>
