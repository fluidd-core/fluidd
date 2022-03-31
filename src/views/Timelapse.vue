<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col
      cols="12"
      md="8"
    >
      <collapsable-card
        :title="$t('app.timelapse.title.timelapse')"
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
      <timelapse-status-card />
      <timelapse-settings-card />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import CollapsableCard from '@/components/common/CollapsableCard.vue'
import AppSlider from '@/components/ui/AppSlider.vue'
import AppSetting from '@/components/ui/AppSetting.vue'
import TimelapseStatusCard from '@/components/widgets/timelapse/TimelapseStatusCard.vue'
import TimelapseSettingsCard from '@/components/widgets/timelapse/TimelapseSettingsCard.vue'

@Component({
  components: {
    AppSetting,
    AppSlider,
    CollapsableCard,
    FileSystem,
    TimelapseStatusCard,
    TimelapseSettingsCard
  }
})
export default class Timelapse extends Mixins(StateMixin) {}
</script>
