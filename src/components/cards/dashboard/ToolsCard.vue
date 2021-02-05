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
      <span class="font-weight-light">{{$t('Thermals')}}</span>
    </template>

    <template v-slot:tabbed-title="{ attrs, on }" v-if="showTabs && !inLayout">
      <v-tabs
        v-if="showTabs && !inLayout"
        v-model="tab"
        grow
        background-color="quaternary"
        class="rounded-t"
      >
        <v-tab :key="'targets'" :disabled="inLayout || attrs.isCollapsed">
          <v-icon left>$fire</v-icon>
          {{$t('Thermals')}}
        </v-tab>
        <v-tab :key="'jobs'" v-if="klippyConnected && jobsInDash" :disabled="inLayout || attrs.isCollapsed">
          <v-icon left>$files</v-icon>
          {{$t('Jobs')}}
        </v-tab>
        <btn-collapse
          class="align-self-center ml-1 mr-4"
          :value="attrs.isCollapsed"
          :in-layout="inLayout"
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
      <v-tab-item :key="'jobs'" class="tertiary rounded-b max-height" v-if="jobsInDash && jobsAvailable">
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
import TemperatureTargetsWidget from '@/components/widgets/TemperatureTargetsWidget.vue'

@Component({
  components: {
    FileSystemCard,
    TemperatureTargetsWidget
  }
})
export default class ToolsCard extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  tab = 0

  get showTabs () {
    return (this.jobsInDash)
  }

  get jobsInDash () {
    return this.$store.state.config.fileConfig.general.jobsInDash
  }

  get jobsAvailable () {
    return this.$store.getters['files/isRootAvailable']('gcodes')
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
