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
        <app-slider
          v-model="retractLength"
          :label="$t('app.general.label.retract_length')"
          suffix="mm"
          :reset-value="defaults.retract_length"
          :min="0"
          :max="maxRetractLength"
          :step="0.01"
          :overridable="true"
          :disabled="!klippyReady"
          :locked="!klippyReady || isMobile"
          :loading="hasWait($waits.onSetRetractLength)"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="12"
        lg="6"
        class="py-0"
      >
        <app-slider
          v-model="unretractExtraLength"
          :label="$t('app.general.label.unretract_extra_length')"
          suffix="mm"
          :reset-value="defaults.unretract_extra_length"
          :min="0"
          :max="maxUnretractExtraLength"
          :step="0.01"
          :overridable="true"
          :disabled="!klippyReady"
          :locked="!klippyReady || isMobile"
          :loading="hasWait($waits.onSetUnretractExtraLength)"
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
        <app-slider
          v-model="retractSpeed"
          :label="$t('app.general.label.retract_speed')"
          suffix="mm/s"
          :reset-value="defaults.retract_speed"
          :min="0"
          :step="1"
          :max="maxRetractSpeed"
          :overridable="true"
          :disabled="!klippyReady"
          :locked="!klippyReady || isMobile"
          :loading="hasWait($waits.onSetRetractSpeed)"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="12"
        lg="6"
        class="py-0"
      >
        <app-slider
          v-model="unretractSpeed"
          :label="$t('app.general.label.unretract_speed')"
          suffix="mm/s"
          :reset-value="defaults.unretract_speed"
          :min="0"
          :step="1"
          :max="maxUnretractSpeed"
          :overridable="true"
          :disabled="!klippyReady"
          :locked="!klippyReady || isMobile"
          :loading="hasWait($waits.onSetUnretractSpeed)"
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
  get retractLength () {
    return this.$store.state.printer.printer.firmware_retraction.retract_length
  }

  set retractLength (val: number) {
    this.sendGcode(`SET_RETRACTION RETRACT_LENGTH=${val}`, this.$waits.onSetRetractLength)
  }

  get maxRetractLength () {
    if (this.defaults.retract_length <= 0) return 15
    return Math.round(this.defaults.retract_length * 2 * 100) / 100
  }

  get retractSpeed () {
    return this.$store.state.printer.printer.firmware_retraction.retract_speed
  }

  set retractSpeed (val: number) {
    this.sendGcode(`SET_RETRACTION RETRACT_SPEED=${val}`, this.$waits.onSetRetractSpeed)
  }

  get maxRetractSpeed () {
    if (this.defaults.retract_speed <= 0) return 100
    return Math.round(this.defaults.retract_speed * 2)
  }

  get unretractSpeed () {
    return this.$store.state.printer.printer.firmware_retraction.unretract_speed
  }

  set unretractSpeed (val: number) {
    this.sendGcode(`SET_RETRACTION UNRETRACT_SPEED=${val}`, this.$waits.onSetUnretractSpeed)
  }

  get maxUnretractSpeed () {
    if (this.defaults.unretract_speed <= 0) return 100
    return Math.round(this.defaults.unretract_speed * 2)
  }

  get unretractExtraLength () {
    return this.$store.state.printer.printer.firmware_retraction.unretract_extra_length
  }

  set unretractExtraLength (val: number) {
    this.sendGcode(`SET_RETRACTION UNRETRACT_EXTRA_LENGTH=${val}`, this.$waits.onSetUnretractExtraLength)
  }

  get maxUnretractExtraLength () {
    if (this.defaults.unretract_extra_length <= 0) return 15
    return Math.round(this.defaults.unretract_extra_length * 2 * 100) / 100
  }

  get defaults () {
    return this.$store.getters['printer/getPrinterSettings']('firmware_retraction') || {}
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}
</script>
