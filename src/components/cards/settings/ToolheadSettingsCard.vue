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
      <v-switch
        class="mt-0 mb-4"
        label="Use GCode Coordinates"
        hide-details
        v-model="useGcodeCoords">
      </v-switch>
      <v-text-field
        filled
        label="Default Extrude Length"
        suffix="mm"
        v-model.number="defaultExtrudeLength"
      ></v-text-field>
      <v-text-field
        filled
        label="Default Extrude Speed"
        suffix="mm/s"
        v-model.number="defaultExtrudeSpeed"
      ></v-text-field>
      <v-select
        filled
        label="Default toolhead move length"
        suffix="mm"
        :items="['0.1', '1.0', '10', '100']"
        v-model.number="defaultToolheadMoveLength"
      ></v-select>
      <v-text-field
        filled
        label="Toolhead XY Move Speed"
        suffix="mm/s"
        v-model.number="defaultToolheadXYSpeed"
      ></v-text-field>
      <v-text-field
        filled
        label="Toolhead Z Move Speed"
        suffix="mm/s"
        v-model.number="defaultToolheadZSpeed"
      ></v-text-field>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Debounce } from 'vue-debounce-decorator'

const debounceTime = 250

@Component({
  components: {}
})
export default class ToolHeadSettingsCard extends Mixins(StateMixin) {
  defaultExtrudeSpeed = this.$store.state.config.uiSettings.general.defaultExtrudeSpeed
  defaultExtrudeLength = this.$store.state.config.uiSettings.general.defaultExtrudeLength
  defaultToolheadMoveLength = this.$store.state.config.uiSettings.general.defaultToolheadMoveLength
  defaultToolheadXYSpeed = this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed
  defaultToolheadZSpeed = this.$store.state.config.uiSettings.general.defaultToolheadZSpeed

  @Watch('defaultExtrudeSpeed')
  @Debounce(debounceTime)
  onDefaultExtrudeSpeed (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultExtrudeSpeed',
      value,
      server: true
    })
  }

  @Watch('defaultExtrudeLength')
  @Debounce(debounceTime)
  onDefaultExtrudeLength (value: number) {
    console.log('got it', value)
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultExtrudeLength',
      value,
      server: true
    })
  }

  @Watch('defaultToolheadMoveLength')
  @Debounce(debounceTime)
  onDefaultToolheadMoveLength (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultToolheadMoveLength',
      value,
      server: true
    })
  }

  @Watch('defaultToolheadXYSpeed')
  @Debounce(debounceTime)
  onDefaultToolheadXYSpeed (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultToolheadXYSpeed',
      value,
      server: true
    })
  }

  @Watch('defaultToolheadZSpeed')
  @Debounce(debounceTime)
  onDefaultToolheadZSpeed (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.defaultToolheadZSpeed',
      value,
      server: true
    })
  }

  get useGcodeCoords () {
    return this.$store.state.config.uiSettings.general.useGcodeCoords
  }

  set useGcodeCoords (value: boolean) {
    this.$store.dispatch('config/saveGeneric', { key: 'uiSettings.general.useGcodeCoords', value })
  }

  get invertX () {
    return this.$store.state.config.uiSettings.general.axis.x.inverted
  }

  set invertX (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.axis.x.inverted',
      value,
      server: true
    })
  }

  get invertY () {
    return this.$store.state.config.uiSettings.general.axis.y.inverted
  }

  set invertY (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.axis.y.inverted',
      value,
      server: true
    })
  }

  get invertZ () {
    return this.$store.state.config.uiSettings.general.axis.z.inverted
  }

  set invertZ (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.axis.z.inverted',
      value,
      server: true
    })
  }
}
</script>
