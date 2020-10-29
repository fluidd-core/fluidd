<template>
  <v-card class="mb-4">
    <v-tabs
      v-model="activeTab"
      fixed-tabs
      background-color="quaternary"
    >
      <v-tab :key="'targets'">
        <v-icon left>$fire</v-icon>
        Targets
      </v-tab>
      <v-tab :key="'macros'">
        <v-icon left>$fileCode</v-icon>
        Macros
      </v-tab>
      <v-tab :key="'power'" v-if="gpioPowerPluginEnabled">
        <v-icon left>$power</v-icon>
        Power
      </v-tab>
      <v-tab :key="'jobs'" v-if="klippyConnected">
        <v-icon left>$files</v-icon>
        Jobs
      </v-tab>

      <!-- Collapse Control -->
      <v-btn
        @click="isCollapsed = !isCollapsed"
        class="align-self-center ml-2 mr-4"
        fab small text>
        <v-icon v-if="!isCollapsed">$chevronUp</v-icon>
        <v-icon v-if="isCollapsed">$chevronDown</v-icon>
      </v-btn>
    </v-tabs>
    <v-divider></v-divider>

    <v-expand-transition>
      <div v-show="!isCollapsed">
        <v-tabs-items v-model="activeTab" class="mb-auto rounded">
          <v-tab-item :key="'targets'" class="tertiary rounded">
            <temperature-targets-widget></temperature-targets-widget>
          </v-tab-item>
          <v-tab-item :key="'macros'" class="tertiary rounded">
            <macros-widget></macros-widget>
          </v-tab-item>
          <v-tab-item :key="'power'" class="tertiary rounded" v-if="gpioPowerPluginEnabled">
            <power-control-widget></power-control-widget>
          </v-tab-item>
          <v-tab-item :key="'jobs'" class="tertiary rounded max-height" v-if="klippyConnected">
            <file-system-card
              root="gcodes"
              accept=".gcode"
              :show-title="false"
              :show-meta-data="false"
            ></file-system-card>
          </v-tab-item>
        </v-tabs-items>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import FileSystemCard from '@/components/cards/FileSystemCard.vue'
import PowerControlWidget from '@/components/widgets/PowerControlWidget.vue'
import MacrosWidget from '@/components/widgets/MacrosWidget.vue'
import TemperatureTargetsWidget from '@/components/widgets/TemperatureTargetsWidget.vue'

@Component({
  components: {
    FileSystemCard,
    PowerControlWidget,
    MacrosWidget,
    TemperatureTargetsWidget
  }
})
export default class ToolsCard extends Mixins(UtilsMixin) {
  activeTab = 'macros'

  get isCollapsed (): boolean {
    const collapsed = (this.$store.state.config.localConfig.Tools === undefined)
      ? false
      : this.$store.state.config.localConfig.Tools

    return collapsed
  }

  set isCollapsed (val: boolean) {
    this.$store.dispatch('config/saveLocalStorage', { Tools: val })
  }

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
