<template>
  <collapsable-card
    title="Tool"
    cardKey="ToolSettings"
    icon="$printer3dNozzle">
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
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class ToolHeadSettingsCard extends Mixins(UtilsMixin) {
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
