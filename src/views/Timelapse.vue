<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col
      cols="12"
      md="8"
    >
      <collapsable-card
        :title="$t('app.general.title.timelapse')"
        icon="$video"
        :draggable="false"
      >
        <file-system
          :roots="'timelapse'"
          name="timelapse"
          bulk-actions
          :max-height="816"
          :timelapse-browser="true"
        />
      </collapsable-card>
    </v-col>

    <v-col
      cols="12"
      md="4"
    >
      <timelapse-status-card @openRenderDialog="openRenderDialog" />
      <timelapse-settings-card @openRenderDialog="openRenderDialog" />
    </v-col>

    <timelapse-render-settings-dialog
      v-if="renderDialog.open"
      v-model="renderDialog.open"
      :renderable="renderDialog.renderable"
    />
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import CollapsableCard from '@/components/common/CollapsableCard.vue'
import TimelapseStatusCard from '@/components/widgets/timelapse/TimelapseStatusCard.vue'
import TimelapseSettingsCard from '@/components/widgets/timelapse/TimelapseSettingsCard.vue'
import TimelapseRenderSettingsDialog from '@/components/widgets/timelapse/TimelapseRenderSettingsDialog.vue'

@Component({
  components: {
    TimelapseRenderSettingsDialog,
    CollapsableCard,
    FileSystem,
    TimelapseStatusCard,
    TimelapseSettingsCard
  }
})
export default class Timelapse extends Mixins(StateMixin) {
  renderDialog = { open: false, renderable: false }

  openRenderDialog (renderable = false) {
    this.renderDialog = { open: true, renderable }
  }
}
</script>
