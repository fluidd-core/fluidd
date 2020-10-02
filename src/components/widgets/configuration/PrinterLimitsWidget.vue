<template>
  <v-card>
    <v-card-title><v-icon left>mdi-hazard-lights</v-icon> Printer Limits</v-card-title>
    <v-card-subtitle>These are not persistent. They will reset to your printer configuration on host reboot.</v-card-subtitle>
    <v-divider></v-divider>
    <v-card-text>
      <br /><br /><br /><br />
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class PrinterLimitsWidget extends Mixins(UtilsMixin) {

}
</script>
