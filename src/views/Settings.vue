<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <vue-headful
      :title="pageTitle">
    </vue-headful>

    <v-row no-gutters class="mt-0 mt-sm-2">
      <v-col cols="12" class="pa-0">
        <collapsable-card
          title="UI Settings"
          icon="$cogs"
          cardClasses="mb-0 mb-sm-2"
          :collapsable="false">
          <template v-slot:collapse-button>
            <v-btn :color="(hasUnsavedChanges) ? 'error' : 'primary'" class="ml-auto" @click="saveFileConfig()"><v-icon class="mr-2">$save</v-icon> Save</v-btn>
          </template>
        </collapsable-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" sm="4" md="3">
        <klippy-disconnected-card></klippy-disconnected-card>
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
  }
})
export default class Settings extends Mixins(UtilsMixin) {
  pageName = 'Settings'
  get hasUnsavedChanges () {
    return this.$store.state.config.unsavedChanges
  }

  saveFileConfig () {
    EventBus.$emit('flashMessage')
    let instance = this.$store.getters['config/getCurrentInstance']
    if (instance) {
      instance = { ...instance, ...{ name: this.$store.state.config.fileConfig.general.instanceName } }
      this.$store.dispatch('config/updateInstance', instance)
    }
    this.$store.dispatch('config/saveFileConfig')
  }
}
</script>
