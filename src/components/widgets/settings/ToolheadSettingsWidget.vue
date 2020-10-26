<template>
  <v-card color="tertiary" class="mb-4">
    <v-card-title class="quaternary font-weight-light"><v-icon left>$printer3dNozzle</v-icon> Toolhead</v-card-title>
    <v-divider></v-divider>
    <v-card-text>
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
export default class ToolHeadSettingsWidget extends Mixins(UtilsMixin) {
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
