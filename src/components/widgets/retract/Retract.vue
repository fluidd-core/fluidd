<template>
  <v-card-text>
    <v-row class="my-0 mb-4">
      <v-col cols="12" sm="12" class="py-0">
        <app-slider
          :label="$t('app.general.label.retract_length')"
          value-suffix="mm"
          input-sm
          :value="retract_length"
          :min="0"
          :max="10"
          :step="0.1"
          :disabled="!klippyReady"
          :locked="!klippyReady || isMobile"
          :loading="hasWait(waits.onSetRetractLength)"
          @input="setRetractLength($event)">
        </app-slider>
      </v-col>
    </v-row>
    <v-row class="my-0 mb-4">
      <v-col cols="12" sm="6" class="py-0">
        <app-slider
          :label="$t('app.general.label.retract_speed')"
          value-suffix="mm/s"
          input-sm
          :value="retract_speed"
          :min="0"
          :step="1"
          :max="50"
          :disabled="!klippyReady"
          :locked="!klippyReady || isMobile"
          :loading="hasWait(waits.onSetRetractSpeed)"
          @input="setRetractSpeed($event)">
        </app-slider>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <app-slider
          :label="$t('app.general.label.unretract_speed')"
          value-suffix="mm/s"
          input-sm
          :value="unretract_speed"
          :min="0"
          :step="1"
          :max="50"
          :disabled="!klippyReady"
          :locked="!klippyReady || isMobile"
          :loading="hasWait(waits.onSetUnretractSpeed)"
          @input="setUnretractSpeed($event)">
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
