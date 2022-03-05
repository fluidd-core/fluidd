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
        v-if="moveDistance"
        mandatory
        dense
        v-model="moveDistance"
        class="ml-2 d-inline-block"
      >
        <app-btn
          v-for="(value, i) in zAdjustValues"
          small
          class="px-1"
          :key="i"
          :disabled="!klippyReady"
          :min-width="36"
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
            @click="sendZAdjustGcode('+', moveDistance, waits.onZAdjust)"
            :loading="hasWait('ZAdjust')"
            :disabled="!klippyReady"
            small
            block
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
            @click="sendZAdjustGcode('-', moveDistance, waits.onZAdjust)"
            :loading="hasWait('ZAdjust')"
            :disabled="!klippyReady"
            small
            block
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
            @click="handleZApplyDialog"
            :disabled="!klippyReady || printerPrinting || (ZHomingOrigin == 0)"
            small
            block
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
import { Waits } from '@/globals'

@Component({})
export default class ZHeightAdjust extends Mixins(StateMixin) {
  waits = Waits
  moveDistance: number | null = null

  get ZHomingOrigin () {
    // This is an array of 4 values, representing the homing origin.
    // It should be in the order of; X, Y, Z, E.
    if (
      this.$store.state.printer.printer.gcode_move.homing_origin &&
      this.$store.state.printer.printer.gcode_move.homing_origin.length >= 4
    ) {
      const origin = this.$store.state.printer.printer.gcode_move.homing_origin[2]
      return origin.toFixed(3)
    } else {
      return null
    }
  }

  get zAdjustValues () {
    return this.$store.state.config.uiSettings.general.zAdjustDistances
  }

  mounted () {
    this.moveDistance = this.zAdjustValues[0]
  }

  /**
   * Send a Z adjust gcode script.
   */
  sendZAdjustGcode (direction: '+' | '-', distance: string, wait?: string) {
    const zHomed = this.$store.getters['printer/getHomedAxes']('z')
    const gcode = `SET_GCODE_OFFSET Z_ADJUST=${direction}${distance} MOVE=${+zHomed}`
    this.sendGcode(gcode, wait)
  }

  get printerUsesProbeAsEndstop (): boolean {
    return this.$store.getters['printer/getPrinterSettings']('stepper_z.endstop_pin') === 'probe:z_virtual_endstop'
  }

  handleZApplyDialog () {
    let msg = this.$tc('app.general.simple_form.msg.apply_z_offset_endstop')
    let gcode = 'Z_OFFSET_APPLY_ENDSTOP'

    if (this.printerUsesProbeAsEndstop) {
      msg = this.$tc('app.general.simple_form.msg.apply_z_offset_probe')
      gcode = 'Z_OFFSET_APPLY_PROBE'
    }

    this.$confirm(
      msg,
      {
        title: this.$tc('app.general.label.apply_z_offset'),
        color: 'card-heading',
        icon: '$error',
        buttonTrueText: this.$tc('app.general.btn.save_restart'),
        buttonTrueColor: 'primary',
        buttonFalseText: this.$tc('app.general.btn.cancel')
      }
    )
      .then(res => {
        if (res) {
          this.sendGcode(gcode, this.waits.onZApply)
          this.sendGcode('SAVE_CONFIG', this.waits.onSaveConfig)
        }
      })
  }
}
</script>
