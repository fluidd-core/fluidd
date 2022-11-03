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
    return this.activeExtruder?.max_extrude_only_velocity || 500
  }

  get maxExtrudeLength () {
    return this.activeExtruder?.max_extrude_only_distance || 50
  }

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
