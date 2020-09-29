<template>
<!--
    d-flex flex-column align-start
    height="460"
-->
  <v-card class="mb-4">
    <v-tabs-items v-model="activeTab" class="mb-auto">
      <v-tab-item :key="0">
        <v-card-title>
          <v-icon large left>mdi-file-code</v-icon>
          <span class="title font-weight-light text-h5">Macros</span>
        </v-card-title>
        <macros-widget></macros-widget>
      </v-tab-item>
      <v-tab-item :key="1">
        <v-card-title >
          <v-icon large left>mdi-tools</v-icon>
          <span class="title font-weight-light text-h5">Sys Commands</span>
        </v-card-title>
        <system-commands-widget></system-commands-widget>
      </v-tab-item>
      <v-tab-item :key="2">
        <v-card-title >
          <v-icon large left>mdi-file-multiple-outline</v-icon>
          <span class="title font-weight-light text-h5">Jobs</span>
        </v-card-title>
        <v-card-text>
          <file-system-widget root="gcodes" :show-meta-data="false"></file-system-widget>
        </v-card-text>
      </v-tab-item>
      <v-tab-item :key="3">
        <v-card-title >
          <v-icon large left>mdi-console</v-icon>
          <span class="title font-weight-light text-h5">Console</span>
        </v-card-title>
          <console-widget></console-widget>
      </v-tab-item>
    </v-tabs-items>

    <v-tabs
      v-model="activeTab"
      fixed-tabs
      icons-and-text
    >
    <!-- class="flex-grow-0" -->
      <v-tab :key="0">
        Macros
        <v-icon>mdi-file-code</v-icon>
      </v-tab>
      <v-tab :key="1">
        Sys Commands
        <v-icon>mdi-tools</v-icon>
      </v-tab>
      <v-tab :key="2">
        Jobs
        <v-icon>mdi-file-multiple-outline</v-icon>
      </v-tab>
      <v-tab :key="3">
        Console
        <v-icon>mdi-console</v-icon>
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
