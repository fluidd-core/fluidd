<template>
  <collapsable-card
    :title="`Klippy: ${klippyState}`"
    icon="$error"
    icon-color="error"
  >
    <v-card-text>
      <v-row>
        <v-col
          cols="12"
          sm="auto"
        >
          <system-control />
        </v-col>
        <v-col
          cols="12"
          sm=""
        >
          <v-alert
            v-if="klippyStateMessage !== 'Printer is ready'"
            text
            dense
            type="error"
          >
            <span v-html="klippyStateMessage" />
          </v-alert>
          <app-warnings v-if="hasWarnings" />
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
