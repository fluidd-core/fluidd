<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" sm="4" md="3" class="pt-0">
        <general-settings-card></general-settings-card>
        <theme-settings-card></theme-settings-card>
        <print-time-estimate-settings-card></print-time-estimate-settings-card>
      </v-col>
      <v-col cols="12" sm="4" md="3" class="pt-0">
        <camera-settings-card></camera-settings-card>
        <toolhead-settings-card></toolhead-settings-card>
      </v-col>
      <v-col cols="12" sm="4" md="6" class="pt-0">
        <klippy-card v-if="!klippyConnected || hasWarnings"></klippy-card>
        <temperature-preset-settings-card></temperature-preset-settings-card>
        <macro-settings-card></macro-settings-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import MacroSettingsCard from '@/components/cards/settings/MacroSettingsCard.vue'
import GeneralSettingsCard from '@/components/cards/settings/GeneralSettingsCard.vue'
import TemperaturePresetSettingsCard from '@/components/cards/settings/TemperaturePresetSettingsCard.vue'
import KlippyCard from '@/components/cards/KlippyCard.vue'
import CameraSettingsCard from '@/components/cards/settings/CameraSettingsCard.vue'
import ToolheadSettingsCard from '@/components/cards/settings/ToolheadSettingsCard.vue'
import PrintTimeEstimateSettingsCard from '@/components/cards/settings/PrintTimeEstimateSettingsCard.vue'
import ThemeSettingsCard from '@/components/cards/settings/ThemeSettingsCard.vue'

@Component({
  components: {
    MacroSettingsCard,
    GeneralSettingsCard,
    TemperaturePresetSettingsCard,
    KlippyCard,
    CameraSettingsCard,
    ToolheadSettingsCard,
    PrintTimeEstimateSettingsCard,
    ThemeSettingsCard
  }
})
export default class Settings extends Mixins(UtilsMixin) {}
</script>
