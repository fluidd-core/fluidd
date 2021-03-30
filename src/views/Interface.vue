<template>
  <v-container fluid class="constrained-width">
    <v-row justify="center">
      <v-col cols="12" md="6">
        <general-settings></general-settings>
        <camera-settings></camera-settings>
        <theme-settings></theme-settings>
        <toolhead-settings></toolhead-settings>
        <macro-settings></macro-settings>
        <temperature-preset-settings></temperature-preset-settings>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

import MacroSettings from '@/components/settings/MacroSettings.vue'
import GeneralSettings from '@/components/settings/GeneralSettings.vue'
import TemperaturePresetSettings from '@/components/settings/TemperaturePresetSettings.vue'
import CameraSettings from '@/components/settings/CameraSettings.vue'
import ToolheadSettings from '@/components/settings/ToolheadSettings.vue'
import ThemeSettings from '@/components/settings/ThemeSettings.vue'

@Component({
  components: {
    MacroSettings,
    GeneralSettings,
    TemperaturePresetSettings,
    CameraSettings,
    ToolheadSettings,
    ThemeSettings
  }
})
export default class Settings extends Mixins(StateMixin) {}
</script>
