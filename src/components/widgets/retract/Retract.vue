<template>
  <v-card-text>
    <v-row class="my-0 mb-4">
      <v-col
        cols="12"
        sm="6"
        md="12"
        lg="6"
        class="py-0"
      >
        <app-named-slider
          :label="$t('app.general.label.retract_length')"
          suffix="mm"
          :value="retract_length"
          :reset-value="defaults.retract_length"
          :min="0"
          :max="retract_length_max"
          :step="0.01"
          overridable
          :disabled="!klippyReady"
          :locked="isMobile"
          :loading="hasWait($waits.onSetRetractLength)"
          @submit="setRetractLength"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="12"
        lg="6"
        class="py-0"
      >
        <app-named-slider
          :label="$t('app.general.label.unretract_extra_length')"
          suffix="mm"
          :value="unretract_extra_length"
          :reset-value="defaults.unretract_extra_length"
          :min="0"
          :max="unretract_extra_length_max"
          :step="0.01"
          overridable
          :disabled="!klippyReady"
          :locked="isMobile"
          :loading="hasWait($waits.onSetUnretractExtraLength)"
          @submit="setUnRetractExtraLength"
        />
      </v-col>
    </v-row>
    <v-row class="my-0 mb-4">
      <v-col
        cols="12"
        sm="6"
        md="12"
        lg="6"
        class="py-0"
      >
        <app-named-slider
          :label="$t('app.general.label.retract_speed')"
          suffix="mm/s"
          :value="retract_speed"
          :reset-value="defaults.retract_speed"
          :min="0"
          :step="1"
          :max="retract_speed_max"
          overridable
          :disabled="!klippyReady"
          :locked="isMobile"
          :loading="hasWait($waits.onSetRetractSpeed)"
          @submit="setRetractSpeed"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="12"
        lg="6"
        class="py-0"
      >
        <app-named-slider
          :label="$t('app.general.label.unretract_speed')"
          suffix="mm/s"
          :value="unretract_speed"
          :reset-value="defaults.unretract_speed"
          :min="0"
          :step="1"
          :max="unretract_speed_max"
          overridable
          :disabled="!klippyReady"
          :locked="isMobile"
          :loading="hasWait($waits.onSetUnretractSpeed)"
          @submit="setUnretractSpeed"
        />
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class Retract extends Mixins(StateMixin) {
  get retract_length () {
    return this.$store.state.printer.printer.firmware_retraction.retract_length
  }

  get retract_length_max () {
    if (this.defaults.retract_length <= 0) return 15
    return Math.round(this.defaults.retract_length * 2 * 100) / 100
  }

  get retract_speed () {
    return this.$store.state.printer.printer.firmware_retraction.retract_speed
  }

  get retract_speed_max () {
    if (this.defaults.retract_speed <= 0) return 100
    return Math.round(this.defaults.retract_speed * 2)
  }

  get unretract_speed () {
    return this.$store.state.printer.printer.firmware_retraction.unretract_speed
  }

  get unretract_speed_max () {
    if (this.defaults.unretract_speed <= 0) return 100
    return Math.round(this.defaults.unretract_speed * 2)
  }

  get unretract_extra_length () {
    return this.$store.state.printer.printer.firmware_retraction.unretract_extra_length
  }

  get unretract_extra_length_max () {
    if (this.defaults.unretract_extra_length <= 0) return 15
    return Math.round(this.defaults.unretract_extra_length * 2 * 100) / 100
  }

  get defaults () {
    return this.$store.getters['printer/getPrinterSettings']('firmware_retraction') || {}
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  setRetractLength (val: number) {
    this.sendGcode(`SET_RETRACTION RETRACT_LENGTH=${val}`, this.$waits.onSetRetractLength)
  }

  setRetractSpeed (val: number) {
    this.sendGcode(`SET_RETRACTION RETRACT_SPEED=${val}`, this.$waits.onSetRetractSpeed)
  }

  setUnretractSpeed (val: number) {
    this.sendGcode(`SET_RETRACTION UNRETRACT_SPEED=${val}`, this.$waits.onSetUnretractSpeed)
  }

  setUnRetractExtraLength (val: number) {
    this.sendGcode(`SET_RETRACTION UNRETRACT_EXTRA_LENGTH=${val}`, this.$waits.onSetUnretractExtraLength)
  }
}
</script>
