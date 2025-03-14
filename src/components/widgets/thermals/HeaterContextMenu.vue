<template>
  <v-menu
    v-model="open"
    transition="slide-y-transition"
    :position-x="positionX"
    :position-y="positionY"
    min-width="180"
    absolute
    right
  >
    <v-list dense>
      <v-list-item
        :disabled="!klippyReady || printerPrinting || !heaterIsOn"
        @click="$emit('turn-off', heater)"
      >
        <v-list-item-icon>
          <v-icon>
            $snowflake
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.chart.label.turn_off') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-divider />

      <v-list-item
        :disabled="!klippyReady || printerPrinting"
        @click="$emit('pid-calibrate', heater)"
      >
        <v-list-item-icon>
          <v-icon>
            $tools
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>PID_CALIBRATE</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item
        v-if="klippyApp.isKalicoOrDangerKlipper"
        :disabled="!klippyReady || printerPrinting || !heaterUsesMpcControl"
        @click="$emit('mpc-calibrate', heater)"
      >
        <v-list-item-icon>
          <v-icon>
            $tools
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>MPC_CALIBRATE</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Prop, VModel, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { Heater, KlippyApp } from '@/store/printer/types'

@Component({})
export default class HeaterContextMenu extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Number, required: true })
  readonly positionX!: number

  @Prop({ type: Number, required: true })
  readonly positionY!: number

  @Prop({ type: Object, required: true })
  readonly heater!: Heater

  get klippyApp (): KlippyApp {
    return this.$typedGetters['printer/getKlippyApp']
  }

  get heaterIsOn () {
    return this.heater.target > 0
  }

  get heaterUsesMpcControl () {
    return this.heater.config?.control === 'mpc'
  }
}
</script>
