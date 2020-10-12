<template>
  <v-card color="tertiary" class="mb-4">

    <v-tabs-items v-model="activeTab" class="mb-auto rounded">
      <v-tab-item :key="0" class="tertiary rounded">
        <v-card-title class="quaternary rounded">
          <v-icon left>{{ icons.fileCode }}</v-icon>
          <span class="font-weight-light">Macros</span>
        </v-card-title>
        <v-divider></v-divider>
        <macros-widget></macros-widget>
      </v-tab-item>
      <v-tab-item :key="1" class="tertiary rounded">
        <v-card-title class="quaternary rounded">
          <v-icon left>{{ icons.tools }}</v-icon>
          <span class="font-weight-light">Sys Commands</span>
        </v-card-title>
        <v-divider></v-divider>
        <system-commands-widget></system-commands-widget>
      </v-tab-item>
      <v-tab-item :key="2" class="tertiary rounded">
        <file-system-widget
          root="gcodes"
          accept=".gcode"
          :show-meta-data="false"
        ></file-system-widget>
      </v-tab-item>
      <v-tab-item :key="3" class="tertiary rounded">
        <v-card-title class="quaternary rounded">
          <v-icon left>{{ icons.console }}</v-icon>
          <span class="font-weight-light">Console</span>
        </v-card-title>
        <v-divider></v-divider>
        <console-widget></console-widget>
      </v-tab-item>
    </v-tabs-items>

    <v-tabs
      v-model="activeTab"
      fixed-tabs
      icons-and-text
      background-color="tertiary"
    >
      <v-tab :key="0">
        <span class="d-none d-sm-inline">Macros</span>
        <v-icon>{{ icons.fileCode }}</v-icon>
      </v-tab>
      <v-tab :key="1">
        <span class="d-none d-sm-inline">Sys Commands</span>
        <v-icon>{{ icons.tools }}</v-icon>
      </v-tab>
      <v-tab :key="2">
        <span class="d-none d-sm-inline">Jobs</span>
        <v-icon>{{ icons.files }}</v-icon>
      </v-tab>
      <v-tab :key="3">
        <span class="d-none d-sm-inline">Console</span>
        <v-icon>{{ icons.console }}</v-icon>
      </v-tab>
    </v-tabs>

  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import MacrosWidget from '@/components/widgets/MacrosWidget.vue'
import FileSystemWidget from '@/components/widgets/filesystem/FileSystemWidget.vue'
import SystemCommandsWidget from '@/components/widgets/SystemCommandsWidget.vue'
import ConsoleWidget from '@/components/widgets/ConsoleWidget.vue'

@Component({
  components: {
    MacrosWidget,
    FileSystemWidget,
    SystemCommandsWidget,
    ConsoleWidget
  }
})
export default class ToolsCard extends Mixins(UtilsMixin) {
  activeTab = 0
}
</script>

<style lang="scss" scoped>
  ::v-deep .v-tabs > .v-slide-group--is-overflowing.v-tabs-bar--is-mobile > .v-slide-group__prev,
  ::v-deep .v-tabs > .v-slide-group--is-overflowing.v-tabs-bar--is-mobile > .v-slide-group__next {
    display: none !important;
  }
</style>
