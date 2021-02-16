<template>
  <collapsable-card
    title="Tool"
    cardKey="ToolSettings"
    icon="$printer3dNozzle">
    <v-card-text>
      <v-switch
        class="mt-0 mb-4"
        label="Invert X"
        hide-details
        v-model="invertX">
      </v-switch>
      <v-switch
        class="mt-0 mb-4"
        label="Invert Y"
        hide-details
        v-model="invertY">
      </v-switch>
      <v-switch
        class="mt-0 mb-4"
        label="Invert Z"
        hide-details
        v-model="invertZ">
      </v-switch>
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
      <v-text-field
        filled
        label="Toolhead XY Move Speed"
        suffix="mm/s"
        v-model="defaultToolheadXYSpeed"
      ></v-text-field>
      <v-text-field
        filled
        label="Toolhead Z Move Speed"
        suffix="mm/s"
        v-model="defaultToolheadZSpeed"
      ></v-text-field>
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
    return this.$store.state.config.uiSettings.general.defaultExtrudeSpeed
  }

  set defaultExtrudeSpeed (value: number) {
    this.$store.dispatch('config/saveGeneric', { key: 'uiSettings.general.defaultExtrudeSpeed', value })
  }

  get defaultExtrudeLength () {
    return this.$store.state.config.uiSettings.general.defaultExtrudeLength
  }

  set defaultExtrudeLength (value: number) {
    this.$store.dispatch('config/saveGeneric', { key: 'uiSettings.general.defaultExtrudeLength', value })
  }

  get defaultToolheadMoveLength () {
    return this.$store.state.config.uiSettings.general.defaultToolheadMoveLength
  }

  set defaultToolheadMoveLength (value: number) {
    this.$store.dispatch('config/saveGeneric', { key: 'uiSettings.general.defaultToolheadMoveLength', value })
  }

  get defaultToolheadXYSpeed () {
    return this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed
  }

  set defaultToolheadXYSpeed (value: number) {
    this.$store.dispatch('config/saveGeneric', { key: 'uiSettings.general.defaultToolheadXYSpeed', value })
  }

  get defaultToolheadZSpeed () {
    return this.$store.state.config.uiSettings.general.defaultToolheadZSpeed
  }

  set defaultToolheadZSpeed (value: number) {
    this.$store.dispatch('config/saveGeneric', { key: 'uiSettings.general.defaultToolheadZSpeed', value })
  }

  get invertX () {
    return this.$store.state.config.uiSettings.general.axis.x.inverted
  }

  set invertX (value: boolean) {
    this.$store.dispatch('config/saveGeneric', { key: 'uiSettings.general.axis.x.inverted', value })
  }

  get invertY () {
    return this.$store.state.config.uiSettings.general.axis.y.inverted
  }

  set invertY (value: boolean) {
    this.$store.dispatch('config/saveGeneric', { key: 'uiSettings.general.axis.y.inverted', value })
  }

  get invertZ () {
    return this.$store.state.config.uiSettings.general.axis.z.inverted
  }

  set invertZ (value: boolean) {
    this.$store.dispatch('config/saveGeneric', { key: 'uiSettings.general.axis.z.inverted', value })
  }
}
</script>
