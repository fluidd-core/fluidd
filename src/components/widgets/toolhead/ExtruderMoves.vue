<template>
  <v-form
    v-model="valid"
    @submit.prevent
  >
    <v-row justify="end">
      <v-col
        cols="6"
        class="text-right"
      >
        <v-text-field
          ref="lengthfield"
          v-model.number="extrudeLength"
          :disabled="!klippyReady"
          :rules="[rules.min, rules.maxLength]"
          hide-details
          outlined
          dense
          :label="$t('app.general.label.extrude_length')"
          suffix="mm"
          @focus="$event.target.select()"
        />
      </v-col>
      <v-col cols="6">
        <app-btn
          :disabled="!extruderReady || !klippyReady || !valid"
          :elevation="2"
          block
          @click="sendRetractGcode(extrudeLength, extrudeSpeed, waits.onExtrude)"
        >
          {{ $t('app.general.btn.retract') }}
          <v-icon>$chevronUp</v-icon>
        </app-btn>
      </v-col>
    </v-row>
    <v-row
      justify="end"
      class="mt-0"
    >
      <v-col
        cols="6"
        class="text-right"
      >
        <v-text-field
          v-model.number="extrudeSpeed"
          :disabled="!klippyReady"
          :rules="[rules.min, rules.maxSpeed]"
          hide-details
          outlined
          dense
          :label="$t('app.general.label.extrude_speed')"
          suffix="mm/s"
          @focus="$event.target.select()"
        />
      </v-col>
      <v-col cols="6">
        <app-btn
          :disabled="!extruderReady || !klippyReady || !valid"
          :elevation="2"
          block
          @click="sendExtrudeGcode(extrudeLength, extrudeSpeed, waits.onExtrude)"
        >
          {{ $t('app.general.btn.extrude') }}
          <v-icon>$chevronDown</v-icon>
        </app-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import { Waits } from '@/globals'

@Component({})
export default class ExtruderMoves extends Mixins(StateMixin, ToolheadMixin) {
  waits = Waits
  feedSpeed = -1
  feedLength = -1
  valid = true

  rules = {
    min: (v: number) => {
      return (v >= 0.1) || this.$t('app.general.simple_form.error.min', { min: 0.1 })
    },
    maxSpeed: (v: number) => {
      return (v <= this.maxExtrudeSpeed) || this.$t('app.general.simple_form.error.max', { max: this.maxExtrudeSpeed })
    },
    maxLength: (v: number) => {
      return (v <= this.maxExtrudeLength) || this.$t('app.general.simple_form.error.max', { max: this.maxExtrudeLength })
    }
  }

  get maxExtrudeSpeed () {
    return this.$store.getters['printer/getPrinterSettings']('extruder.max_extrude_only_velocity')
  }

  get maxExtrudeLength () {
    return this.$store.getters['printer/getPrinterSettings']('extruder.max_extrude_only_distance')
  }

  get extrudeSpeed () {
    return (this.feedSpeed === -1)
      ? this.$store.state.config.uiSettings.general.defaultExtrudeSpeed
      : this.feedSpeed
  }

  set extrudeSpeed (val: number) {
    this.feedSpeed = val
  }

  get extrudeLength () {
    return (this.feedLength === -1)
      ? this.$store.state.config.uiSettings.general.defaultExtrudeLength
      : this.feedLength
  }

  set extrudeLength (val: number) {
    this.feedLength = val
  }

  sendRetractGcode (amount: number, rate: number, wait?: string) {
    if (this.valid) {
      const gcode = `M83
        G1 E-${amount} F${rate * 60}`
      this.sendGcode(gcode, wait)
    }
  }

  sendExtrudeGcode (amount: number, rate: number, wait?: string) {
    if (this.valid) {
      const gcode = `M83
        G1 E${amount} F${rate * 60}`
      this.sendGcode(gcode, wait)
    }
  }
}
</script>
