<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <template v-for="(container, containerIndex) in containers">
      <v-col
        v-if="inLayout || hasCards(container)"
        :key="`container${containerIndex}`"
        cols="12"
        md="6"
        :lg="columnSpan"
        :class="{ 'drag': inLayout }"
      >
        <draggable
          v-model="containers[containerIndex]"
          class="list-group"
          v-bind="dragOptions"
          @start.stop="drag = true"
          @end.stop="handleStopDrag"
        >
          <transition-group
            type="transition"
            :name="!drag ? 'flip-list' : null"
          >
            <template v-for="c in container">
              <component
                :is="c.id"
                v-if="(c.enabled && !filtered(c)) || inLayout"
                :key="c.id"
                :menu-collapsed="menuCollapsed"
                class="mb-2 mb-sm-4"
              />
            </template>
          </transition-group>
        </draggable>
      </v-col>
    </template>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
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
import RetractCard from '@/components/widgets/retract/RetractCard.vue'
import { LayoutConfig } from '@/store/layout/types'
import BedMeshCard from '@/components/widgets/bedmesh/BedMeshCard.vue'
import GcodePreviewCard from '@/components/widgets/gcode-preview/GcodePreviewCard.vue'
import { Macro } from '@/store/macros/types'

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
    RetractCard,
    ConsoleCard,
    OutputsCard,
    BedMeshCard,
    GcodePreviewCard
  }
})
export default class Dashboard extends Mixins(StateMixin) {
  drag = false
  menuCollapsed = false
  containers: Array<LayoutConfig[]> = []

  mounted () {
    this.onLayoutChange()

    window.addEventListener('resize', this.updateMenuCollapsed)

    this.updateMenuCollapsed()
  }

  unmounted () {
    window.removeEventListener('resize', this.updateMenuCollapsed)
  }

  get columnCount () {
    if (this.inLayout) return 4

    return this.containers.reduce((count, container) => +this.hasCards(container) + count, 0)
  }

  @Watch('columnCount')
  onColumnCount (value: number) {
    this.$store.commit('config/setContainerColumnCount', value)
  }

  get columnSpan () {
    return 12 / this.columnCount
  }

  get hasCameras (): boolean {
    return this.$store.getters['cameras/getEnabledCameras'].length
  }

  get firmwareRetractionEnabled (): boolean {
    return 'firmware_retraction' in this.$store.getters['printer/getPrinterSettings']()
  }

  get supportsBedMesh () {
    return this.$store.getters['mesh/getSupportsBedMesh']
  }

  get macros () {
    return this.$store.getters['macros/getVisibleMacros']
  }

  get uncategorizedMacros () {
    const macros = this.$store.getters['macros/getMacrosByCategory']()
    return macros.filter((macro: Macro) => macro.visible)
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  get layout () {
    const layoutName = this.$store.getters['layout/getSpecificLayout']
    return this.$store.getters['layout/getLayout'](layoutName)
  }

  @Watch('layout')
  onLayoutChange () {
    const containers: Array<LayoutConfig[]> = []

    for (let index = 1; index <= 4; index++) {
      const container = this.layout[`container${index}`]

      if (container?.length > 0) {
        containers.push(container)
      }
    }

    while (containers.length < 4) {
      containers.push([])
    }

    this.containers = containers.slice(0, 4)

    this.updateMenuCollapsed()
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

  updateMenuCollapsed () {
    this.menuCollapsed = (this.$el.clientWidth / this.columnCount) < 560
  }

  handleStopDrag () {
    this.drag = false
    this.$store.dispatch('layout/onLayoutChange', {
      name: this.$store.getters['layout/getSpecificLayout'],
      value: {
        container1: this.containers[0],
        container2: this.containers[1],
        container3: this.containers[2],
        container4: this.containers[3]
      }
    })
  }

  hasCards (container: LayoutConfig[]) {
    return container.some(card => card.enabled && !this.filtered(card))
  }

  filtered (item: LayoutConfig) {
    // Take care of special cases.
    if (this.inLayout) return false
    if (item.id === 'camera-card' && !this.hasCameras) return true
    if (item.id === 'macros-card' && (this.macros.length <= 0 && this.uncategorizedMacros.length <= 0)) return true
    if (item.id === 'printer-status-card' && !this.klippyReady) return true
    if (item.id === 'retract-card' && !this.firmwareRetractionEnabled) return true
    if (item.id === 'bed-mesh-card' && !this.supportsBedMesh) return true

    // Otherwise return the opposite of whatever the enabled state is.
    return !item.enabled
  }
}
</script>

<style lang="scss" scoped>
@import '@/scss/draggable.scss';
</style>
