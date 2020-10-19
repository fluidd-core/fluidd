<template>
  <v-card color="tertiary" class="mb-4">

    <v-tabs
      v-model="activeTab"
      fixed-tabs
      background-color="quaternary"
    >
      <v-tab :key="0">
        <v-icon left>{{ icons.fileCode }}</v-icon>
        Macros
      </v-tab>
      <v-tab :key="1">
        <v-icon left>{{ icons.tools }}</v-icon>
        Sys Commands
      </v-tab>
      <v-tab :key="2">
        <v-icon left>{{ icons.files }}</v-icon>
        Jobs
      </v-tab>
      <v-tab :key="3">
        <v-icon left>{{ icons.console }}</v-icon>
        Console
      </v-tab>
    </v-tabs>
    <v-divider></v-divider>

    <v-tabs-items v-model="activeTab" class="mb-auto rounded">
      <v-tab-item :key="0" class="tertiary rounded">
        <macros-widget></macros-widget>
      </v-tab-item>
      <v-tab-item :key="1" class="tertiary rounded">
        <system-commands-widget></system-commands-widget>
      </v-tab-item>
      <v-tab-item :key="2" class="tertiary rounded max-height">
        <file-system-widget
          root="gcodes"
          accept=".gcode"
          :show-title="false"
          :show-meta-data="false"
        ></file-system-widget>
      </v-tab-item>
      <v-tab-item :key="3" class="tertiary rounded max-height">
        <console-widget></console-widget>
      </v-tab-item>
    </v-tabs-items>

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
  .v-tabs-items {
    > .v-window__container {
      > .v-window-item.max-height {
        height: 400px;
      }
    }
  }

  ::v-deep .v-tabs > .v-slide-group--is-overflowing.v-tabs-bar--is-mobile > .v-slide-group__prev,
  ::v-deep .v-tabs > .v-slide-group--is-overflowing.v-tabs-bar--is-mobile > .v-slide-group__next {
    display: none !important;
  }
</style>
