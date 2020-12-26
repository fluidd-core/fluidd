<template>
  <collapsable-card
    title="Tabbed Tools"
    icon="$tabs"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    @enabled="$emit('enabled', $event)">

    <template v-slot:title v-if="!showTabs && !inLayout">
      <v-icon left>$fire</v-icon>
      <span class="font-weight-light">Targets</span>
    </template>

    <template v-slot:tabbed-title="{ attrs, on }" v-if="showTabs && !inLayout">
      <v-tabs
        v-if="showTabs && !inLayout"
        v-model="tab"
        fixed-tabs
        background-color="quaternary"
        class="rounded-t"
      >
        <v-tab :key="'targets'" :disabled="attrs.inLayout || attrs.isCollapsed">
          <v-icon left>$fire</v-icon>
          Targets
        </v-tab>
        <v-tab :key="'macros'" v-if="hasMacros" :disabled="attrs.inLayout || attrs.isCollapsed">
          <v-icon left>$fileCode</v-icon>
          Macros
        </v-tab>
        <v-tab :key="'power'" v-if="devicePowerPluginEnabled" :disabled="attrs.inLayout || attrs.isCollapsed">
          <v-icon left>$power</v-icon>
          Power
        </v-tab>
        <v-tab :key="'jobs'" v-if="klippyConnected && jobsInDash" :disabled="attrs.inLayout || attrs.isCollapsed">
          <v-icon left>$files</v-icon>
          Jobs
        </v-tab>
        <btn-collapse
          class="align-self-center ml-1 mr-4"
          v-bind="attrs"
          v-on="on"
        >
        </btn-collapse>
      </v-tabs>
    </template>

    <v-tabs-items v-model="tab" class="mb-auto rounded-b">
      <v-tab-item :key="'targets'" class="tertiary rounded-b">
        <temperature-targets-widget></temperature-targets-widget>
      </v-tab-item>
      <v-tab-item :key="'macros'" class="tertiary rounded-b" v-if="hasMacros">
        <macros-widget></macros-widget>
      </v-tab-item>
      <v-tab-item :key="'power'" class="tertiary rounded-b" v-if="devicePowerPluginEnabled">
        <power-control-widget></power-control-widget>
      </v-tab-item>
      <v-tab-item :key="'jobs'" class="tertiary rounded-b max-height" v-if="klippyConnected && jobsInDash">
        <file-system-card
          root="gcodes"
          accept=".gcode,.ufp"
          dense
          :height="400"
          :show-title="false"
          :show-meta-data="false"
          :upload-and-print="true"
        ></file-system-card>
      </v-tab-item>
    </v-tabs-items>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
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
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

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

  get devicePowerPluginEnabled () {
    return (this.$store.state.socket.plugins.includes('power'))
  }

  get jobsInDash () {
    return this.$store.state.config.fileConfig.general.jobsInDash
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>

<style lang="scss" scoped>
  ::v-deep .v-tabs > .v-slide-group--is-overflowing.v-tabs-bar--is-mobile > .v-slide-group__prev,
  ::v-deep .v-tabs > .v-slide-group--is-overflowing.v-tabs-bar--is-mobile > .v-slide-group__next {
    display: none !important;
  }
</style>
