<template>
  <v-card color="tertiary">
    <v-card-title class="quaternary"><v-icon left>mdi-cogs</v-icon> Settings</v-card-title>
    <v-card-subtitle class="quaternary">General settings.</v-card-subtitle>
    <v-divider></v-divider>
    <v-card-text>
      <p>
        Print times can be estimated based on the slicer data, filament used or klipper. <br />
        Alternatively you can choose to just present the current print time and progress. <br />
        Slicer estimations tend to hit under actual print time, but the total does not fluctuate. <br />
        Klipper and Filament estimations get more accurate over time.
      </p>
      <v-radio-group
        v-model="printTimeEstimationsType"
        :mandatory="true">
        <v-radio label="Current print duration only" value="totals"></v-radio>
        <v-radio label="Slicer data for total print time" value="slicer"></v-radio>
        <v-radio label="Klipper estimations (Accuracy over time)" value="file"></v-radio>
        <v-radio label="Filament used for total print time" value="filament"></v-radio>
      </v-radio-group>
    </v-card-text>
    <v-divider></v-divider>
    <v-card-text>
      <v-text-field
        filled
        label="Camera URL"
        v-model="cameraUrl"
      ></v-text-field>
    </v-card-text>
    <v-divider></v-divider>
    <v-card-text>
      <p>Preselects the default extrude length and speed on the dasboard.</p>
      <v-text-field
        filled
        label="Default Extrude Length"
        suffix="mm"
        v-model="defaultExtrudeLength"
      ></v-text-field>
      <v-text-field
        filled
        label="Default Extrude Speed"
        suffix="mm/s"
        v-model="defaultExtrudeSpeed"
      ></v-text-field>
    </v-card-text>
    <v-divider></v-divider>
    <v-card-text>
      <p>Preselects the toolhead move speed on the dashboard.</p>
      <v-select
        filled
        label="Default toolhead move length"
        suffix="mm"
        :items="['0.1', '1.0', '10', '100']"
        v-model="defaultToolheadMoveLength">
      </v-select>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class GeneralSettingsWidget extends Mixins(UtilsMixin) {
  get cameraUrl () {
    return this.$store.state.config.fileConfig.camera.url
  }

  set cameraUrl (value: string) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.camera.url', value })
  }

  get defaultExtrudeSpeed () {
    return this.$store.state.config.fileConfig.general.defaultExtrudeSpeed
  }

  set defaultExtrudeSpeed (value: number) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.defaultExtrudeSpeed', value })
  }

  get defaultExtrudeLength () {
    return this.$store.state.config.fileConfig.general.defaultExtrudeLength
  }

  set defaultExtrudeLength (value: number) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.defaultExtrudeLength', value })
  }

  get defaultToolheadMoveLength () {
    return this.$store.state.config.fileConfig.general.defaultToolheadMoveLength
  }

  set defaultToolheadMoveLength (value: number) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.defaultToolheadMoveLength', value })
  }

  get printTimeEstimationsType () {
    return this.$store.state.config.fileConfig.general.printTimeEstimationsType
  }

  set printTimeEstimationsType (value: string) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.printTimeEstimationsType', value })
  }
}
</script>
