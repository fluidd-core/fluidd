<template>
  <v-row
    align="start"
    justify="end"
  >
    <v-col
      cols="6"
      class="text-right"
    >
      <v-btn-toggle
        v-model="moveDistance"
        mandatory
        dense
      >
        <app-btn
          v-for="(value, i) in zAdjustValues"
          :key="i"
          small
          class="px-1"
          :disabled="!klippyReady"
          :min-width="36"
          :elevation="2"
          :value="value"
        >
          {{ value }}
        </app-btn>
      </v-btn-toggle>
      <div class="mt-1">
        <span class="secondary--text">{{ $t('app.general.label.z_offset') }}&nbsp;</span>
        <span>{{ ZHomingOrigin }}mm</span>
      </div>
    </v-col>
    <v-col cols="6">
      <v-row
        justify="space-between"
        no-gutters
        class="mr-n1"
      >
        <v-col
          cols="4"
          class="pr-1"
        >
          <app-btn
            :loading="hasWait($waits.onZAdjust)"
            :disabled="!klippyReady"
            small
            block
            @click="sendZAdjustGcode('+')"
          >
            <v-icon small>
              $zUp
            </v-icon>
          </app-btn>
        </v-col>
        <v-col
          cols="4"
          class="pr-1"
        >
          <app-btn
            :loading="hasWait($waits.onZAdjust)"
            :disabled="!klippyReady"
            small
            block
            @click="sendZAdjustGcode('-')"
          >
            <v-icon small>
              $zDown
            </v-icon>
          </app-btn>
        </v-col>
        <v-col
          cols="4"
          class="pr-1"
        >
          <app-btn
            :disabled="!klippyReady || printerPrinting || (ZHomingOrigin == 0)"
            small
            block
            @click="handleZApplyDialog"
          >
            <v-icon small>
              $save
            </v-icon>
          </app-btn>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class ZHeightAdjust extends Mixins(StateMixin) {
  _moveDistance: number | null = null

  get ZHomingOrigin () {
    // This is an array of 4 values, representing the homing origin.
    // It should be in the order of; X, Y, Z, E.
    const { homing_origin } = this.$store.state.printer.printer.gcode_move

    return homing_origin && homing_origin.length >= 4
      ? homing_origin[2].toFixed(3)
      : null
  }

  get zAdjustValues () {
    return this.$store.state.config.uiSettings.general.zAdjustDistances
  }

  get moveDistance () {
    return this._moveDistance || this.zAdjustValues[0]
  }

  set moveDistance (value: number) {
    this._moveDistance = value
  }

  /**
   * Send a Z adjust gcode script.
   */
  sendZAdjustGcode (direction: '+' | '-') {
    const zHomed = this.$store.getters['printer/getHomedAxes']('z')
    const gcode = `SET_GCODE_OFFSET Z_ADJUST=${direction}${this.moveDistance} MOVE=${+zHomed}`
    this.sendGcode(gcode, this.$waits.onZAdjust)
  }

  get printerUsesProbeAsEndstop (): boolean {
    return this.$store.getters['printer/getPrinterSettings']('stepper_z.endstop_pin') === 'probe:z_virtual_endstop'
  }

  async handleZApplyDialog () {
    const [gcode, msg] = this.printerUsesProbeAsEndstop
      ? ['Z_OFFSET_APPLY_PROBE', this.$tc('app.general.simple_form.msg.apply_z_offset_probe')]
      : ['Z_OFFSET_APPLY_ENDSTOP', this.$tc('app.general.simple_form.msg.apply_z_offset_endstop')]

    const res = await this.$confirm(
      msg,
      {
        title: this.$tc('app.general.label.apply_z_offset'),
        color: 'card-heading',
        icon: '$error',
        buttonTrueText: this.$tc('app.general.btn.save_restart'),
        buttonFalseText: this.$tc('app.general.btn.cancel')
      })

    if (res) {
      this.sendGcode(gcode, this.waits.onZApply)
      this.sendGcode('SAVE_CONFIG', this.waits.onSaveConfig)
    }
  }
}
</script>
