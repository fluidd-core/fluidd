<template>
  <collapsable-card
    title="Bed Adjustments"
    icon="$bedMesh">
    <v-card>
      <v-card-title>z-adjust</v-card-title>
      <v-card-text>
        <btn @click="sendGcode('Z_ENDSTOP_CALIBRATE')">adjust-z</btn>
        <v-chip>{{ pendingSave }}</v-chip>
        <p>
          PROBE_CALIBRATE<br />
          DELTA_CALIBRATE<br />
          BED_TILT_CALIBRATE<br />
          BED_MESH_CALIBRATE<br />
          BED_SCREWS_ADJUST<br />
          SCREWS_TILT_CALCULATE<br />
          Z_TILT_ADJUST<br />
          Z_ENDSTOP_CALIBRATE<br />
          PID_CALIBRATE<br />

        </p>
      </v-card-text>
    </v-card>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({})
export default class BedAdjustCard extends Mixins(UtilsMixin) {
  get pendingSave () {
    return this.$store.state.socket.printer.configfile.save_config_pending
  }
}
</script>
