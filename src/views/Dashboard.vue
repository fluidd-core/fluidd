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
            group: 'dashboard',
            disabled: !inLayout,
          }"
          target=":first-child"
          @end="handleUpdateLayout"
        >
          <transition-group
            type="transition"
            :name="!inLayout ? 'flip-list' : undefined"
          >
            <template v-for="c in container">
              <component
                :is="c.id"
                v-if="inLayout || (c.enabled && !filtered(c))"
                :key="c.id"
                :menu-collapsed="menuCollapsed"
                class="mb-2 mb-md-4"
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
import type { LayoutConfig, LayoutContainer } from '@/store/layout/types'
import BedMeshCard from '@/components/widgets/bedmesh/BedMeshCard.vue'
import GcodePreviewCard from '@/components/widgets/gcode-preview/GcodePreviewCard.vue'
import JobQueueCard from '@/components/widgets/job-queue/JobQueueCard.vue'
import SpoolmanCard from '@/components/widgets/spoolman/SpoolmanCard.vue'
import SensorsCard from '@/components/widgets/sensors/SensorsCard.vue'
import RunoutSensorsCard from '@/components/widgets/runout-sensors/RunoutSensorsCard.vue'
import BeaconCard from '@/components/widgets/beacon/BeaconCard.vue'
import type { KlipperPrinterSettings } from '@/store/printer/types'

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
    SensorsCard,
    RunoutSensorsCard,
    BeaconCard
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
    this.$typedCommit('config/setContainerColumnCount', value)

    this.updateMenuCollapsed()
  }

  get columnSpan () {
    return 12 / this.columnCount
  }

  get printerSettings (): KlipperPrinterSettings {
    return this.$typedGetters['printer/getPrinterSettings']
  }

  get hasCameras (): boolean {
    return this.$typedGetters['webcams/getEnabledWebcams'].length > 0
  }

  get hasHeatersOrTemperatureSensors (): boolean {
    return (
      this.$typedGetters['printer/getHeaters'].length > 0 ||
      this.$typedGetters['printer/getOutputs'](['temperature_fan']).length > 0 ||
      this.$typedGetters['printer/getSensors'].length > 0
    )
  }

  get hasSensors (): boolean {
    return this.$typedGetters['sensors/getSensors'].length > 0
  }

  get firmwareRetractionEnabled (): boolean {
    return 'firmware_retraction' in this.printerSettings
  }

  get supportsJobQueue (): boolean {
    return this.$typedGetters['server/componentSupport']('job_queue')
  }

  get supportsBedMesh (): boolean {
    return this.$typedGetters['mesh/getSupportsBedMesh']
  }

  get supportsBeacon (): boolean {
    return this.$typedGetters['printer/getSupportsBeacon']
  }

  get supportsRunoutSensors (): boolean {
    return this.$typedGetters['printer/getRunoutSensors'].length > 0
  }

  get supportsSpoolman (): boolean {
    return this.$typedGetters['server/componentSupport']('spoolman')
  }

  get hasMacros (): boolean {
    return this.$typedGetters['macros/getVisibleMacros'].length > 0
  }

  get hasOutputs (): boolean {
    return (
      this.$typedGetters['printer/getAllFans']().length > 0 ||
      this.$typedGetters['printer/getPins']().length > 0 ||
      this.$typedGetters['printer/getAllLeds']().length > 0
    )
  }

  get inLayout (): boolean {
    return this.$typedState.config.layoutMode
  }

  get layout (): LayoutContainer | undefined {
    const layoutName: string = this.$typedGetters['layout/getSpecificLayoutName']

    return this.$typedGetters['layout/getLayout'](layoutName)
  }

  @Watch('layout')
  onLayoutChange () {
    const containers: Array<LayoutConfig[]> = []

    for (let index = 1; index <= 4; index++) {
      const container = this.layout?.[`container${index}`]

      if (container && container.length > 0) {
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
    const name: string = this.$typedGetters['layout/getSpecificLayoutName']

    this.$typedDispatch('layout/onLayoutChange', {
      name,
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
    if (item.id === 'outputs-card' && !this.hasOutputs) return true
    if (item.id === 'printer-status-card' && !this.klippyReady) return true
    if (item.id === 'job-queue-card' && !this.supportsJobQueue) return true
    if (item.id === 'retract-card' && !this.firmwareRetractionEnabled) return true
    if (item.id === 'bed-mesh-card' && !this.supportsBedMesh) return true
    if (item.id === 'beacon-card' && !this.supportsBeacon) return true
    if (item.id === 'runout-sensors-card' && !this.supportsRunoutSensors) return true
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
