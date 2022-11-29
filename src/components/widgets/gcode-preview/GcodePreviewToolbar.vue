<template>
  <v-toolbar dense>
    <v-toolbar-title v-if="file">
      {{ file.name }}
    </v-toolbar-title>

    <v-spacer />

    <div class="text-no-wrap">
      <gcode-preview-toolbar-button
        name="followProgress"
        icon="$play"
        :disabled="disabled"
        :tooltip="$t('app.gcode.label.follow_progress')"
      />

      <gcode-preview-toolbar-button
        name="showPreviousLayer"
        icon="$previousLayer"
        :disabled="disabled"
        :tooltip="$t('app.gcode.label.show_previous_layer')"
      />

      <gcode-preview-toolbar-button
        name="showCurrentLayer"
        icon="$currentLayer"
        :disabled="disabled"
        :tooltip="$t('app.gcode.label.show_current_layer')"
      />

      <gcode-preview-toolbar-button
        name="showNextLayer"
        icon="$nextLayer"
        :disabled="disabled"
        :tooltip="$t('app.gcode.label.show_next_layer')"
      />

      <gcode-preview-toolbar-button
        name="showMoves"
        icon="$moves"
        :disabled="disabled"
        :tooltip="$t('app.gcode.label.show_moves')"
      />

      <gcode-preview-toolbar-button
        name="showExtrusions"
        icon="$extrusions"
        :disabled="disabled"
        :tooltip="$t('app.gcode.label.show_extrusions')"
      />

      <gcode-preview-toolbar-button
        name="showRetractions"
        icon="$retractions"
        :disabled="disabled"
        :tooltip="$t('app.gcode.label.show_retractions')"
      />

      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            fab
            small
            text
            :disabled="disabled"
            v-on="on"
            @click="autoZoom = !autoZoom"
          >
            <v-icon>{{ autoZoom ? '$magnifyMinus' : '$magnifyPlus' }}</v-icon>
          </v-btn>
        </template>
        <span>zoom</span>
      </v-tooltip>
    </div>
  </v-toolbar>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StatesMixin from '@/mixins/state'
import { AppFile } from '@/store/files/types'
import GcodePreviewToolbarButton from './GcodePreviewToolbarButton.vue'

@Component({
  components: {
    GcodePreviewToolbarButton
  }
})
export default class GcodePreviewToolbar extends Mixins(StatesMixin) {
  get disabled () {
    return this.file === undefined
  }

  get file (): AppFile | undefined {
    return this.$store.getters['gcodePreview/getFile']
  }

  get autoZoom () {
    return this.$store.state.config.uiSettings.gcodePreview.autoZoom
  }

  set autoZoom (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.autoZoom',
      value,
      server: true
    })
  }
}
</script>
