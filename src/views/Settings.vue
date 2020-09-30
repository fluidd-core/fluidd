<template>
  <v-container fluid class="dashboard">
    <v-row>
      <v-col cols="12" class="pt-0">
        <v-card>
          <v-card-title>
            <v-icon large left>mdi-cog</v-icon>
            <span class="title font-weight-light text-h5">UI Settings</span>
            <v-btn :color="(hasUnsavedChanges) ? 'error' : 'primary'" class="ml-auto" @click="saveFileConfig()"><v-icon class="mr-2">mdi-content-save-alert-outline</v-icon> Save Changes</v-btn>
          </v-card-title>
        </v-card>
        <v-row>
          <v-col cols="6">
            <general-settings-widget></general-settings-widget>
            <!-- <temperature-presets-settings-widget></temperature-presets-settings-widget> -->
          </v-col>
          <v-col cols="6">
            <macro-settings-widget></macro-settings-widget>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import MacroSettingsWidget from '@/components/widgets/settings/MacroSettingsWidget.vue'
import GeneralSettingsWidget from '@/components/widgets/settings/GeneralSettingsWidget.vue'
import TemperaturePresetsSettingsWidget from '@/components/widgets/settings/TemperaturePresetsSettingsWidget.vue'
import EventBus from '@/eventBus'

@Component({
  components: {
    MacroSettingsWidget,
    GeneralSettingsWidget,
    TemperaturePresetsSettingsWidget
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
