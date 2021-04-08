<template>
  <v-container fluid class="constrained-width px-2 px-sm-4">
    <v-row class="mt-0 mt-sm-2">
      <v-col cols="12" md="6" class="pt-0">
        <klippy-status-card v-if="!klippyReady || hasWarnings"></klippy-status-card>
        <printer-status-card v-if="klippyReady"></printer-status-card>
        <draggable
          class="list-group"
          v-model="col1"
          v-bind="dragOptions"
          @start.stop="drag = true"
          @end.stop="drag = false"
        >
          <transition-group type="transition" :name="!drag ? 'flip-list' : null">
            <component
              v-for="c in col1"
              :is="c.name"
              :key="c.name"
              :enabled="c.enabled"
              @enabled="onEnabled($event, c, 'dashboard1')">
            </component>
          </transition-group>
        </draggable>
      </v-col>
      <v-col cols="12" md="6" class="pt-0">
        <draggable
          class="list-group"
          v-model="col2"
          v-bind="dragOptions"
          @start.stop="drag = true"
          @end.stop="drag = false"
        >
          <transition-group type="transition" :name="!drag ? 'flip-list' : null">
            <component v-for="c in col2" :is="c.name" :key="c.name" :enabled="c.enabled" @enabled="onEnabled($event, c, 'dashboard2')"></component>
          </transition-group>
        </draggable>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { CardConfig } from '@/store/config/types'
import { cloneDeep } from 'lodash-es'
import draggable from 'vuedraggable'

import PrinterStatusCard from '@/components/widgets/status/PrinterStatusCard.vue'
import JobsCard from '@/components/widgets/jobs/JobsCard.vue'
import ToolheadCard from '@/components/widgets/toolhead/ToolheadCard.vue'
import TemperatureCard from '@/components/widgets/thermals/TemperatureCard.vue'
import CameraCard from '@/components/widgets/camera/CameraCard.vue'
import MacrosCard from '@/components/widgets/macros/MacrosCard.vue'
import ConsoleCard from '@/components/widgets/console/ConsoleCard.vue'
import OutputsCard from '@/components/widgets/outputs/OutputsCard.vue'
import PrinterLimitsCard from '@/components/widgets/limits/PrinterLimitsCard.vue'

@Component({
  components: {
    draggable,
    PrinterStatusCard,
    JobsCard,
    ToolheadCard,
    MacrosCard,
    TemperatureCard,
    CameraCard,
    PrinterLimitsCard,
    ConsoleCard,
    OutputsCard
  }
})
export default class Dashboard extends Mixins(StateMixin) {
  drag = false

  get camerasEnabled (): boolean {
    return this.$store.getters['cameras/getVisibleCameras'].length > 0
  }

  get hasMacros () {
    return this.$store.getters['macros/hasVisibleMacros']
  }

  get col1 (): CardConfig[] {
    return this.filterComponents(this.$store.getters['config/getCards']('dashboard1'))
  }

  set col1 (cards: CardConfig[]) {
    this.saveCards(cards, 'dashboard1')
  }

  get col2 (): CardConfig[] {
    return this.filterComponents(this.$store.getters['config/getCards']('dashboard2'))
  }

  set col2 (cards: CardConfig[]) {
    this.saveCards(cards, 'dashboard2')
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  get dragOptions () {
    return {
      animation: 200,
      handle: '.handle',
      group: 'dashboard',
      disabled: !this.inLayout,
      ghostClass: 'ghost'
    }
  }

  saveCards (cards: CardConfig[], group: string) {
    // Take care of special cases.
    // cards.forEach((card) => {
    //   if (card.name === 'camera-card') {
    //     this.$store.dispatch('config/saveGeneric', { key: 'uiSettings.camera.enabled', value: card.enabled })
    //   }
    // })
    this.$store.dispatch('config/saveCardConfig', { group, cards })
  }

  filterComponents (componentArray: CardConfig[]) {
    return componentArray.filter((s) => {
      // Take care of special cases.
      if (this.inLayout) return true
      if (s.name === 'camera-card' && !this.camerasEnabled) return false
      if (s.name === 'macros-card' && !this.hasMacros) return false

      // Otherwise return whatever the enabled state is.
      return s.enabled
    })
  }

  onEnabled (enabled: boolean, c: CardConfig, group: string) {
    const cards = cloneDeep(this.$store.getters['config/getCards'](group))
    const card = cards.find((card: CardConfig) => c.name === card.name)
    if (card) {
      card.enabled = enabled
      this.$store.dispatch('config/saveCardConfig', { group, cards })
    }
  }
}
</script>

<style lang="scss" scoped>
  .flip-list-move {
    transition: transform 0.5s;
  }

  .no-move {
    transition: transform 0s;
  }

  .ghost {
    opacity: 0.5;
    background: #ccc;
  }

  .list-group {
    min-height: 20px;

    span {
      display: flex;
      flex-direction: column;
    }
  }

</style>
