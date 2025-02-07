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
          <v-row>
            <v-col
              v-if="printerPoweredOff"
              cols="12"
            >
              <v-alert
                text
                dense
                type="error"
                class="ma-0"
              >
                <span v-html="$t('app.general.error.printer_powered_off')" />
              </v-alert>
            </v-col>
            <v-col
              v-else-if="klippyStateMessage !== 'Printer is ready'"
              cols="12"
            >
              <v-alert
                text
                dense
                type="error"
                class="ma-0"
              >
                <span v-html="klippyStateMessage" />
              </v-alert>
            </v-col>
            <v-col
              v-if="hasWarnings"
              cols="12"
            >
              <app-warnings />
            </v-col>
          </v-row>
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
