<template>
  <collapsable-card
    :title="$t('Tool')"
    cardKey="ToolSettings"
    icon="$printer3dNozzle">
    <v-card-text>
      <v-switch
        class="mt-0 mb-4"
        :label="$t('Invert X')"
        hide-details
        v-model="invertX">
      </v-switch>
      <v-switch
        class="mt-0 mb-4"
        :label="$t('Invert Y')"
        hide-details
        v-model="invertY">
      </v-switch>
      <v-switch
        class="mt-0 mb-4"
        :label="$t('Invert Z')"
        hide-details
        v-model="invertZ">
      </v-switch>
      <v-text-field
        filled
        :label="$t('Default Extrude Length')"
        suffix="mm"
        v-model="defaultExtrudeLength"
      ></v-text-field>
      <v-text-field
        filled
        :label="$t('Default Extrude Speed')"
        suffix="mm/s"
        v-model="defaultExtrudeSpeed"
      ></v-text-field>
      <v-select
        filled
        :label="$t('Default toolhead move length')"
        suffix="mm"
        :items="['0.1', '1.0', '10', '100']"
        v-model="defaultToolheadMoveLength">
      </v-select>
      <v-text-field
        filled
        :label="$t('Toolhead XY Move Speed')"
        suffix="mm/s"
        v-model="defaultToolheadXYSpeed"
      ></v-text-field>
      <v-text-field
        filled
        :label="$t('Toolhead Z Move Speed')"
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

  get defaultToolheadXYSpeed () {
    return this.$store.state.config.fileConfig.general.defaultToolheadXYSpeed
  }

  set defaultToolheadXYSpeed (value: number) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.defaultToolheadXYSpeed', value })
  }

  get defaultToolheadZSpeed () {
    return this.$store.state.config.fileConfig.general.defaultToolheadZSpeed
  }

  set defaultToolheadZSpeed (value: number) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.defaultToolheadZSpeed', value })
  }

  get invertX () {
    return this.$store.state.config.fileConfig.general.axis.x.inverted
  }

  set invertX (value: boolean) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.axis.x.inverted', value })
  }

  get invertY () {
    return this.$store.state.config.fileConfig.general.axis.y.inverted
  }

  set invertY (value: boolean) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.axis.y.inverted', value })
  }

  get invertZ () {
    return this.$store.state.config.fileConfig.general.axis.z.inverted
  }

  set invertZ (value: boolean) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.axis.z.inverted', value })
  }
}
</script>
