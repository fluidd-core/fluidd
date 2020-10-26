<template>
  <v-card color="tertiary" class="mb-4">
    <v-card-title class="quaternary font-weight-light"><v-icon left>{{ icons.clock }}</v-icon> Print Times</v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-radio-group
        v-model="printTimeEstimationsType"
        :mandatory="true">
        <v-radio label="Duration only" value="totals"></v-radio>
        <v-radio label="Slicer" value="slicer"></v-radio>
        <v-radio label="Klipper (accuracy over time)" value="file"></v-radio>
        <v-radio label="Filament used (accuracy over time)" value="filament"></v-radio>
      </v-radio-group>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class PrintTimeEstimateSettingsWidget extends Mixins(UtilsMixin) {
  get cameraUrl () {
    return this.$store.state.config.fileConfig.camera.url
  }

  set cameraUrl (value: string) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.camera.url', value })
  }

  get printTimeEstimationsType () {
    return this.$store.state.config.fileConfig.general.printTimeEstimationsType
  }

  set printTimeEstimationsType (value: string) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.printTimeEstimationsType', value })
  }
}
</script>
