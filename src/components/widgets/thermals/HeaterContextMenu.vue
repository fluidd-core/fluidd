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
      <v-list-item @click="$emit('pid-calibrate', heater)">
        <v-list-item-icon>
          <v-icon>
            $pidCalibrate
          </v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.chart.label.pid_calibration') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'
import type { Heater } from '@/store/printer/types'

@Component({})
export default class HeaterContextMenu extends Vue {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Number, required: true })
  readonly positionX!: number

  @Prop({ type: Number, required: true })
  readonly positionY!: number

  @Prop({ type: Object, required: true })
  readonly heater!: Heater
}
</script>
