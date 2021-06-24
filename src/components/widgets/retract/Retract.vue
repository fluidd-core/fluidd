<template>
  <v-card-text>
    <v-row class="my-0 mb-4">
      <v-col cols="12" sm="6" md="12" lg="6" class="py-0">
        <app-slider
          :label="$t('app.general.label.retract_length')"
          suffix="mm"
          :value="retract_length"
          :reset-value="defaults.retract_length"
          :min="0"
          :max="15"
          :step="0.01"
          :disabled="!klippyReady"
          :locked="!klippyReady || isMobile"
          :loading="hasWait(waits.onSetRetractLength)"
          @change="setRetractLength">
        </app-slider>
      </v-col>
    </v-row>
    <v-row class="my-0 mb-4">
      <v-col cols="12" sm="6" md="12" lg="6" class="py-0">
        <app-slider
          :label="$t('app.general.label.retract_speed')"
          suffix="mm/s"
          :value="retract_speed"
          :reset-value="defaults.retract_speed"
          :min="0"
          :step="1"
          :max="100"
          :disabled="!klippyReady"
          :locked="!klippyReady || isMobile"
          :loading="hasWait(waits.onSetRetractSpeed)"
          @change="setRetractSpeed">
        </app-slider>
      </v-col>
      <v-col cols="12" sm="6" md="12" lg="6" class="py-0">
        <app-slider
          :label="$t('app.general.label.unretract_speed')"
          suffix="mm/s"
          :value="unretract_speed"
          :reset-value="defaults.unretract_speed"
          :min="0"
          :step="1"
          :max="100"
          :disabled="!klippyReady"
          :locked="!klippyReady || isMobile"
          :loading="hasWait(waits.onSetUnretractSpeed)"
          @change="setUnretractSpeed">
        </app-slider>
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Waits } from '@/globals'

@Component({})
export default class Retract extends Mixins(StateMixin) {
  waits = Waits

  get retract_length () {
    return this.$store.state.printer.printer.firmware_retraction.retract_length
  }

  get retract_speed () {
    return this.$store.state.printer.printer.firmware_retraction.retract_speed
  }

  get unretract_speed () {
    return this.$store.state.printer.printer.firmware_retraction.unretract_speed
  }

  get defaults () {
    return this.$store.getters['printer/getPrinterSettings']('firmware_retraction') || {}
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  setRetractLength (val: number) {
    this.sendGcode(`SET_RETRACTION RETRACT_LENGTH=${val}`, Waits.onSetRetractLength)
  }

  setRetractSpeed (val: number) {
    this.sendGcode(`SET_RETRACTION RETRACT_SPEED=${val}`, Waits.onSetRetractSpeed)
  }

  setUnretractSpeed (val: number) {
    this.sendGcode(`SET_RETRACTION UNRETRACT_SPEED=${val}`, Waits.onSetUnretractSpeed)
  }
}
</script>
