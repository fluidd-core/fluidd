<template>
  <v-card color="tertiary" class="mb-4">

    <v-tabs
      v-model="activeTab"
      fixed-tabs
      background-color="quaternary"
    >
      <v-tab :key="'macros'">
        <v-icon left>{{ icons.fileCode }}</v-icon>
        Macros
      </v-tab>
      <v-tab :key="'power'" v-if="gpioPowerPluginEnabled">
        <v-icon left>{{ icons.power }}</v-icon>
        Power
      </v-tab>
      <v-tab :key="'jobs'" v-if="klippyConnected">
        <v-icon left>{{ icons.files }}</v-icon>
        Jobs
      </v-tab>
      <v-tab :key="'console'">
        <v-icon left>{{ icons.console }}</v-icon>
        Console
      </v-tab>
    </v-tabs>
    <v-divider></v-divider>

    <v-tabs-items v-model="activeTab" class="mb-auto rounded">
      <v-tab-item :key="'macros'" class="tertiary rounded">
        <macros-widget></macros-widget>
      </v-tab-item>
      <v-tab-item :key="'power'" class="tertiary rounded" v-if="gpioPowerPluginEnabled">
        <power-control-widget></power-control-widget>
      </v-tab-item>
      <v-tab-item :key="'jobs'" class="tertiary rounded max-height" v-if="klippyConnected">
        <file-system-widget
          root="gcodes"
          accept=".gcode"
          :show-title="false"
          :show-meta-data="false"
        ></file-system-widget>
      </v-tab-item>
      <v-tab-item :key="'console'" class="tertiary rounded max-height">
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
import ConsoleWidget from '@/components/widgets/ConsoleWidget.vue'
import PowerControlWidget from '@/components/widgets/PowerControlWidget.vue'

@Component({
  components: {
    MacrosWidget,
    FileSystemWidget,
    ConsoleWidget,
    PowerControlWidget
  }
})
export default class ToolsCard extends Mixins(UtilsMixin) {
  activeTab = 'macros'

  get gpioPowerPluginEnabled () {
    return (this.$store.state.socket.plugins.includes('power'))
  }
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
