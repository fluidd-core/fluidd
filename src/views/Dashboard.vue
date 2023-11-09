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
        <app-draggable
          v-model="containers[containerIndex]"
          class="list-group"
          :options="{
            animation: 200,
            handle: '.handle',
            group: 'dashboard',
            disabled: !inLayout,
            ghostClass: 'ghost'
          }"
          target=":first-child"
          @end="handleUpdateLayout"
        >
          <transition-group
            type="transition"
            :name="!inLayout ? 'flip-list' : null"
          >
            <template v-for="c in container">
              <component
                :is="c.id"
                v-if="inLayout || (c.enabled && !filtered(c))"
                :key="c.id"
                :menu-collapsed="menuCollapsed"
                class="mb-2 mb-sm-4"
              />
            </template>
          </transition-group>
        </app-draggable>
      </v-col>
    </template>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
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
import type { LayoutConfig } from '@/store/layout/types'
import BedMeshCard from '@/components/widgets/bedmesh/BedMeshCard.vue'
import GcodePreviewCard from '@/components/widgets/gcode-preview/GcodePreviewCard.vue'
import JobQueueCard from '@/components/widgets/job-queue/JobQueueCard.vue'
import SpoolmanCard from '@/components/widgets/spoolman/SpoolmanCard.vue'
import SensorsCard from '@/components/widgets/sensors/SensorsCard.vue'

@Component({
  components: {
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
    GcodePreviewCard,
    JobQueueCard,
    SpoolmanCard,
    SensorsCard
  }
})
export default class Dashboard extends Mixins(StateMixin) {
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

    this.updateMenuCollapsed()
  }

  get columnSpan () {
    return 12 / this.columnCount
  }

  get hasCameras (): boolean {
    return this.$store.getters['cameras/getEnabledCameras'].length > 0
  }

  get hasHeatersOrTemperatureSensors () {
    return (
      this.$store.getters['printer/getHeaters'].length > 0 ||
      this.$store.getters['printer/getOutputs'](['temperature_fan']).length > 0 ||
      this.$store.getters['printer/getSensors'].length > 0
    )
  }

  get hasSensors (): boolean {
    return this.$store.getters['sensors/getSensors'].length > 0
  }

  get firmwareRetractionEnabled (): boolean {
    return 'firmware_retraction' in this.$store.getters['printer/getPrinterSettings']()
  }

  get supportsJobQueue (): boolean {
    return this.$store.getters['server/componentSupport']('job_queue')
  }

  get supportsBedMesh () {
    return this.$store.getters['mesh/getSupportsBedMesh']
  }

  get supportsSpoolman () {
    return this.$store.getters['spoolman/getSupported']
  }

  get hasMacros () {
    return this.$store.getters['macros/getVisibleMacros'].length > 0
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }

  get layout () {
    const layoutName = this.$store.getters['layout/getSpecificLayoutName']
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
  }

  updateMenuCollapsed () {
    this.menuCollapsed = (this.$el.clientWidth / this.columnCount) < 560
  }

  handleUpdateLayout () {
    this.$store.dispatch('layout/onLayoutChange', {
      name: this.$store.getters['layout/getSpecificLayoutName'],
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
    if (item.id === 'macros-card' && !this.hasMacros) return true
    if (item.id === 'printer-status-card' && !this.klippyReady) return true
    if (item.id === 'job-queue-card' && !this.supportsJobQueue) return true
    if (item.id === 'retract-card' && !this.firmwareRetractionEnabled) return true
    if (item.id === 'bed-mesh-card' && !this.supportsBedMesh) return true
    if (item.id === 'spoolman-card' && !this.supportsSpoolman) return true
    if (item.id === 'sensors-card' && !this.hasSensors) return true
    if (item.id === 'temperature-card' && !this.hasHeatersOrTemperatureSensors) return true

    // Otherwise return the opposite of whatever the enabled state is.
    return !item.enabled
  }
}
</script>

<style lang="scss" scoped>
@import '@/scss/draggable.scss';
</style>
