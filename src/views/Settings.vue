<template>
  <v-container fluid class="dashboard">
    <v-row>
      <v-col cols="12" class="pt-0">
        <v-card color="quaternary">
          <v-card-title class="quaternary">
            <v-icon large left>$cog</v-icon>
            <span class="font-weight-light">UI Settings</span>
            <v-btn :color="(hasUnsavedChanges) ? 'error' : 'primary'" class="ml-auto" @click="saveFileConfig()"><v-icon class="mr-2">$save</v-icon> Save Changes</v-btn>
          </v-card-title>
        </v-card>
        <v-row>
          <v-col cols="12" sm="4" md="3">
            <klippy-disconnected-card v-if="!klippyConnected"></klippy-disconnected-card>
            <general-settings-card></general-settings-card>
            <theme-settings-card></theme-settings-card>
            <print-time-estimate-settings-card></print-time-estimate-settings-card>
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <camera-settings-card></camera-settings-card>
            <toolhead-settings-card></toolhead-settings-card>
            <!-- <temperature-presets-settings-widget></temperature-presets-settings-widget> -->
          </v-col>
          <v-col cols="12" sm="4" md="6">
            <macro-settings-card></macro-settings-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import MacroSettingsCard from '@/components/cards/settings/MacroSettingsCard.vue'
import GeneralSettingsCard from '@/components/cards/settings/GeneralSettingsCard.vue'
import TemperaturePresetsSettingsCard from '@/components/cards/settings/TemperaturePresetsSettingsCard.vue'
import KlippyDisconnectedCard from '@/components/cards/KlippyDisconnectedCard.vue'
import CameraSettingsCard from '@/components/cards/settings/CameraSettingsCard.vue'
import ToolheadSettingsCard from '@/components/cards/settings/ToolheadSettingsCard.vue'
import PrintTimeEstimateSettingsCard from '@/components/cards/settings/PrintTimeEstimateSettingsCard.vue'
import ThemeSettingsCard from '@/components/cards/settings/ThemeSettingsCard.vue'
import { MetaInfo } from 'vue-meta'
import EventBus from '@/eventBus'

@Component({
  components: {
    MacroSettingsCard,
    GeneralSettingsCard,
    TemperaturePresetsSettingsCard,
    KlippyDisconnectedCard,
    CameraSettingsCard,
    ToolheadSettingsCard,
    PrintTimeEstimateSettingsCard,
    ThemeSettingsCard
  },
  metaInfo (this: Settings): MetaInfo {
    return {
      title: 'Settings'
    }
  }
})
export default class Settings extends Mixins(UtilsMixin) {
  get hasUnsavedChanges () {
    return this.$store.state.config.unsavedChanges
  }

  saveFileConfig () {
    EventBus.$emit('flashMessage')
    this.$store.dispatch('config/saveFileConfig')
  }
}
</script>
