<template>
  <v-row
    v-if="hasZOffsetApplyEndstop || hasZOffsetApplyProbe"
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
        class="elevation-2"
      >
        <app-btn
          v-for="(value, i) in zAdjustValues"
          :key="i"
          small
          class="px-1"
          :disabled="!klippyReady"
          min-width="36"
          :value="value"
        >
          {{ value }}
        </app-btn>
      </v-btn-toggle>
      <div
        class="mt-1"
        :class="{ 'text--disabled': !klippyReady }"
      >
        <span class="secondary--text">{{ $t('app.general.label.z_offset') }}&nbsp;</span>
        <span>{{ zHomingOrigin.toFixed(3) }}mm</span>
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
            v-if="hasZOffsetApplyEndstop !== hasZOffsetApplyProbe"
            :disabled="!klippyReady || printerPrinting || zHomingOrigin === 0"
            small
            block
            @click="handleZOffsetApply"
          >
            <v-icon small>
              $save
            </v-icon>
          </app-btn>

          <v-menu
            v-else
            left
            offset-y
            transition="slide-y-transition"
          >
            <template #activator="{ on, attrs, value }">
              <app-btn
                v-bind="attrs"
                :disabled="!klippyReady || printerPrinting || zHomingOrigin === 0"
                small
                block
                v-on="on"
              >
                <v-icon small>
                  $save
                </v-icon>
                <v-icon
                  small
                  class="ml-1"
                  :class="{ 'rotate-180': value }"
                >
                  $chevronDown
                </v-icon>
              </app-btn>
            </template>
            <v-list dense>
              <template v-for="command of ['Z_OFFSET_APPLY_ENDSTOP', 'Z_OFFSET_APPLY_PROBE']">
                <v-list-item
                  :key="command"
                  @click="sendGcode(command)"
                >
                  <v-list-item-icon>
                    <v-icon>
                      $expandVertical
                    </v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ command }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-list>
          </v-menu>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { GcodeCommands } from '@/store/printer/types'

@Component({})
export default class ZHeightAdjust extends Mixins(StateMixin) {
  moveDistanceValue: number | null = null

  get zHomingOrigin (): number {
    // This is an array of 4 values, representing the homing origin.
    // It should be in the order of; X, Y, Z, E.
    const { homing_origin } = this.$store.state.printer.printer.gcode_move

    const zHomingOrigin: number = homing_origin && homing_origin.length >= 4
      ? +homing_origin[2]
      : 0

    return zHomingOrigin
  }

  get zAdjustValues () {
    return this.$store.state.config.uiSettings.general.zAdjustDistances
  }

  get moveDistance () {
    return this.moveDistanceValue || this.zAdjustValues[0]
  }

  set moveDistance (value: number) {
    this.moveDistanceValue = value
  }

  get availableCommands (): GcodeCommands {
    return this.$store.getters['printer/getAvailableCommands'] as GcodeCommands
  }

  get hasZOffsetApplyProbe (): boolean {
    return 'Z_OFFSET_APPLY_PROBE' in this.availableCommands
  }

  get hasZOffsetApplyEndstop (): boolean {
    return 'Z_OFFSET_APPLY_ENDSTOP' in this.availableCommands
  }

  /**
   * Send a Z adjust gcode script.
   */
  sendZAdjustGcode (direction: '+' | '-') {
    const zHomed = this.$store.getters['printer/getHomedAxes']('z')
    const gcode = `SET_GCODE_OFFSET Z_ADJUST=${direction}${this.moveDistance} MOVE=${+zHomed}`
    this.sendGcode(gcode, this.$waits.onZAdjust)
  }

  handleZOffsetApply () {
    if (this.hasZOffsetApplyProbe && !this.hasZOffsetApplyEndstop) {
      this.sendGcode('Z_OFFSET_APPLY_PROBE')
    }

    if (this.hasZOffsetApplyEndstop && !this.hasZOffsetApplyProbe) {
      this.sendGcode('Z_OFFSET_APPLY_ENDSTOP')
    }
  }
}
</script>
