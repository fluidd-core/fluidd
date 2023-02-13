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
          :rules="[
            $rules.numberGreaterThanOrEqual(0.1),
            $rules.numberLessThanOrEqual(maxExtrudeLength)
          ]"
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
          block
          @click="sendRetractGcode(extrudeLength, extrudeSpeed, $waits.onExtrude)"
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
          :rules="[
            $rules.numberGreaterThanOrEqual(0.1),
            $rules.numberLessThanOrEqual(maxExtrudeSpeed)
          ]"
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
          block
          @click="sendExtrudeGcode(extrudeLength, extrudeSpeed, $waits.onExtrude)"
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

@Component({})
export default class ExtruderMoves extends Mixins(StateMixin, ToolheadMixin) {
  valid = true

  get extrudeSpeed () {
    const extrudeSpeed = this.$store.state.config.uiSettings.toolhead.extrudeSpeed

    return extrudeSpeed === -1
      ? this.$store.state.config.uiSettings.general.defaultExtrudeSpeed
      : extrudeSpeed
  }

  set extrudeSpeed (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.toolhead.extrudeSpeed',
      value,
      server: false
    })
  }

  get extrudeLength () {
    const extrudeLength = this.$store.state.config.uiSettings.toolhead.extrudeLength

    return extrudeLength === -1
      ? this.$store.state.config.uiSettings.general.defaultExtrudeLength
      : extrudeLength
  }

  set extrudeLength (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.toolhead.extrudeLength',
      value,
      server: false
    })
  }

  sendRetractGcode (amount: number, rate: number, wait?: string) {
    if (this.valid) {
      const safeAmount = Math.min(amount, this.maxExtrudeLength)
      const safeRate = Math.min(rate, this.maxExtrudeSpeed)

      const gcode = `M83
        G1 E-${safeAmount} F${safeRate * 60}`
      this.sendGcode(gcode, wait)
    }
  }

  sendExtrudeGcode (amount: number, rate: number, wait?: string) {
    if (this.valid) {
      const safeAmount = Math.min(amount, this.maxExtrudeLength)
      const safeRate = Math.min(rate, this.maxExtrudeSpeed)

      const gcode = `M83
        G1 E${safeAmount} F${safeRate * 60}`
      this.sendGcode(gcode, wait)
    }
  }
}
</script>
