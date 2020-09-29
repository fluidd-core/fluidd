<template>
  <v-card>
    <v-card-title>General Settings</v-card-title>
    <v-card-subtitle>General application wide settings.</v-card-subtitle>
    <v-card-text>
      <v-text-field
        label="Camera URL"
        v-model="cameraUrl"
      ></v-text-field>
      <v-text-field
        label="Default Extrude Length"
        suffix="mm"
        v-model="defaultExtrudeLength"
      ></v-text-field>
      <v-text-field
        label="Default Extrude Speed"
        suffix="mm/s"
        v-model="defaultExtrudeSpeed"
      ></v-text-field>
      <v-select
        label="Default Toolhead Move Length"
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
}
</script>
