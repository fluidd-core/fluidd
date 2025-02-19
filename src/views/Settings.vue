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
        <theme-settings />
        <auth-settings v-if="supportsAuth" />
        <console-settings />
        <file-browser-settings />
        <file-editor-settings />
        <macro-settings />
        <camera-settings />
        <toolhead-settings />
        <preset-settings />
        <gcode-preview-settings />
        <timelapse-settings v-if="supportsTimelapse" />
        <spoolman-settings v-if="supportsSpoolman" />
        <version-settings v-if="supportsVersions" />
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

import MacroSettings from '@/components/settings/macros/MacroSettings.vue'
import GeneralSettings from '@/components/settings/GeneralSettings.vue'
import PresetSettings from '@/components/settings/presets/PresetSettings.vue'
import CameraSettings from '@/components/settings/cameras/CameraSettings.vue'
import ToolheadSettings from '@/components/settings/ToolheadSettings.vue'
import ThemeSettings from '@/components/settings/ThemeSettings.vue'
import VersionSettings from '@/components/settings/VersionSettings.vue'
import GcodePreviewSettings from '@/components/settings/GcodePreviewSettings.vue'
import AuthSettings from '@/components/settings/auth/AuthSettings.vue'
import ConsoleSettings from '@/components/settings/console/ConsoleSettings.vue'
import FileBrowserSettings from '@/components/settings/FileBrowserSettings.vue'
import FileEditorSettings from '@/components/settings/FileEditorSettings.vue'
import TimelapseSettings from '@/components/settings/timelapse/TimelapseSettings.vue'
import SpoolmanSettings from '@/components/settings/SpoolmanSettings.vue'

@Component({
  components: {
    SpoolmanSettings,
    TimelapseSettings,
    MacroSettings,
    GeneralSettings,
    PresetSettings,
    CameraSettings,
    ToolheadSettings,
    ThemeSettings,
    VersionSettings,
    GcodePreviewSettings,
    AuthSettings,
    ConsoleSettings,
    FileBrowserSettings,
    FileEditorSettings
  }
})
export default class Settings extends Mixins(StateMixin) {
  get supportsVersions (): boolean {
    return this.$store.getters['server/componentSupport']('update_manager')
  }

  get supportsAuth (): boolean {
    return this.$store.getters['server/componentSupport']('authorization')
  }

  get supportsTimelapse (): boolean {
    return this.$store.getters['server/componentSupport']('timelapse')
  }

  get supportsSpoolman (): boolean {
    return this.$store.getters['server/componentSupport']('spoolman')
  }
}
</script>
