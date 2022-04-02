<template>
  <v-row
    :dense="$vuetify.breakpoint.smAndDown"
    justify="center"
  >
    <v-col
      cols="12"
      lg="8"
    >
      <router-view v-if="authenticated && socketConnected" />
      <div v-if="$route.matched.length === 1">
        <general-settings />
        <console-settings />
        <theme-settings />
        <file-editor-settings />
        <auth-settings v-if="supportsAuth" />
        <macro-categories />
        <cameras />
        <toolhead-settings />
        <preset-settings />
        <gcode-preview-settings />
        <timelapse-settings v-if="supportsTimelapse" />
        <version-settings v-if="supportsVersions" />
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

import MacroCategories from '@/components/settings/macros/MacroCategories.vue'
import GeneralSettings from '@/components/settings/GeneralSettings.vue'
import PresetSettings from '@/components/settings/presets/PresetSettings.vue'
import Cameras from '@/components/settings/cameras/Cameras.vue'
import ToolheadSettings from '@/components/settings/ToolheadSettings.vue'
import ThemeSettings from '@/components/settings/ThemeSettings.vue'
import VersionSettings from '@/components/settings/VersionSettings.vue'
import GcodePreviewSettings from '@/components/settings/GcodePreviewSettings.vue'
import AuthSettings from '@/components/settings/auth/AuthSettings.vue'
import ConsoleSettings from '@/components/settings/console/ConsoleSettings.vue'
import FileEditorSettings from '@/components/settings/FileEditorSettings.vue'
import TimelapseSettings from '@/components/settings/timelapse/TimelapseSettings.vue'

@Component({
  components: {
    TimelapseSettings,
    MacroCategories,
    GeneralSettings,
    PresetSettings,
    Cameras,
    ToolheadSettings,
    ThemeSettings,
    VersionSettings,
    GcodePreviewSettings,
    AuthSettings,
    ConsoleSettings,
    FileEditorSettings
  }
})
export default class Settings extends Mixins(StateMixin) {
  get supportsVersions () {
    return this.$store.getters['server/componentSupport']('update_manager')
  }

  get supportsAuth () {
    return this.$store.getters['server/componentSupport']('authorization')
  }

  get supportsTimelapse () {
    return this.$store.getters['files/isRootAvailable']('timelapse')
  }
}
</script>
