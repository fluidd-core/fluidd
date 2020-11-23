<template>
  <v-card
    class="mb-2 mb-sm-4"
    color="tertiary">

    <v-card-title
      class="card-title quaternary py-1"
      v-if="!showTabs">
      <v-icon left>$fire</v-icon>
      <span class="font-weight-light">Targets</span>
      <v-spacer />

      <btn-collapse v-model="isCollapsed"></btn-collapse>

    </v-card-title>
    <v-tabs
      v-if="showTabs"
      v-model="tab"
      fixed-tabs
      background-color="quaternary"
    >
      <v-tab :key="'targets'">
        <v-icon left>$fire</v-icon>
        Targets
      </v-tab>
      <v-tab :key="'macros'" v-if="hasMacros">
        <v-icon left>$fileCode</v-icon>
        Macros
      </v-tab>
      <v-tab :key="'power'" v-if="devicePowerPluginEnabled">
        <v-icon left>$power</v-icon>
        Power
      </v-tab>
      <v-tab :key="'jobs'" v-if="klippyConnected && jobsInDash">
        <v-icon left>$files</v-icon>
        Jobs
      </v-tab>

      <!-- Collapse Control -->
      <btn-collapse class="align-self-center ml-2 mr-4" v-model="isCollapsed"></btn-collapse>
    </v-tabs>
    <v-divider></v-divider>

    <v-expand-transition>
      <div v-show="!isCollapsed">
        <v-tabs-items v-model="tab" class="mb-auto rounded">
          <v-tab-item :key="'targets'" class="tertiary rounded">
            <temperature-targets-widget></temperature-targets-widget>
          </v-tab-item>
          <v-tab-item :key="'macros'" class="tertiary rounded" v-if="hasMacros">
            <macros-widget></macros-widget>
          </v-tab-item>
          <v-tab-item :key="'power'" class="tertiary rounded" v-if="devicePowerPluginEnabled">
            <power-control-widget></power-control-widget>
          </v-tab-item>
          <v-tab-item :key="'jobs'" class="tertiary rounded max-height" v-if="klippyConnected && jobsInDash">
            <file-system-card
              root="gcodes"
              accept=".gcode,.ufp"
              dense
              :height="400"
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
  tab = 0
  // get activeTab () {
  //   return (this.$store.state.config.localConfig.dashTab === undefined)
  //     ? this.tab
  //     : this.$store.state.config.localConfig.dashTab
  // }

  // set activeTab (val: string) {
  //   this.$store.dispatch('config/saveLocal', { dashTab: val })
  // }

  get showTabs () {
    return (this.hasMacros || this.devicePowerPluginEnabled || this.jobsInDash)
  }

  get hasMacros () {
    return (this.$store.getters['socket/getVisibleMacros'].length)
  }

  get isCollapsed (): boolean {
    const collapsed = (this.$store.state.config.localConfig.Tools === undefined)
      ? false
      : this.$store.state.config.localConfig.Tools

    return collapsed
  }

  set isCollapsed (val: boolean) {
    this.$store.dispatch('config/saveLocal', { Tools: val })
  }

  get devicePowerPluginEnabled () {
    return (this.$store.state.socket.plugins.includes('power'))
  }

  get jobsInDash () {
    return this.$store.state.config.fileConfig.general.jobsInDash
  }
}
</script>

<style lang="scss" scoped>
  .v-tabs-items {
    > .v-window__container {
      > .v-window-item.max-height {
        // height: 400px;
      }
    }
  }

  ::v-deep .v-tabs > .v-slide-group--is-overflowing.v-tabs-bar--is-mobile > .v-slide-group__prev,
  ::v-deep .v-tabs > .v-slide-group--is-overflowing.v-tabs-bar--is-mobile > .v-slide-group__next {
    display: none !important;
  }
</style>
