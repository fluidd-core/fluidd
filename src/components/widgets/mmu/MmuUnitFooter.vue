<template>
  <div
    :class="footerClasses"
    class="d-flex flex-row align-center px-2 pb-1"
  >
    <div
      v-if="showFooter && showLogos"
      class="mmu-logo"
      :style="{
        height: `${logoHeight}px`
      }"
    >
      <inline-svg
        :src="vendorLogoUrl"
        height="100%"
        @error="logoError = true"
      />
    </div>
    <div
      v-if="showFooter"
      class="flex-grow-1 flex-shrink-1 min-width-0 text-caption"
    >
      <div
        v-if="showName"
        class="text-truncate"
      >
        {{ unitDisplayName }}
      </div>
      <v-tooltip
        v-if="showDetails && showClimate"
        v-model="isTooltipOpen"
        :disabled="!showPerGateReport"
        top
        open-delay="500"
      >
        <template #activator="{ on, attrs }">
          <div
            class="text-truncate d-flex"
            v-bind="attrs"
            v-on="on"
          >
            <span
              v-if="unitClimateHumidity"
              class="d-inline-flex align-center mr-1"
            >
              <v-icon
                v-if="showClimateIcons"
                size="18"
                class="blue--text ml-n1"
              >$mmuHumidity</v-icon>
              {{ unitClimateHumidity }}
            </span>
            <span
              v-if="unitClimateTemp"
              class="d-inline-flex align-center mr-2"
            >
              <v-icon
                v-if="showClimateIcons"
                size="18"
                class="deep-orange--text"
              >$mmuTemp</v-icon>
              {{ unitClimateTemp }}
            </span>
            <span
              v-if="unitHeaterIcon"
              class="d-inline-flex align-center ml-auto"
            >
              <v-icon
                size="22"
                class="red--text"
              >{{ unitHeaterIcon }}</v-icon>
              {{ unitHeaterTemp }}
            </span>
          </div>
        </template>
        <span style="white-space: pre-line">{{ perGateReportCached }}</span>
      </v-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'
import type { Sensor } from '@/store/printer/types'

@Component
export default class MmuUnitFooter extends Mixins(BrowserMixin, StateMixin, MmuMixin) {
  @Prop({ required: false, default: 0 })
  readonly unitIndex!: number

  @Prop({ required: false, default: true })
  readonly showDetails!: boolean

  @Prop({ required: false, default: true })
  readonly showFooter!: boolean

  logoError = false
  isTooltipOpen = false
  perGateReportCached = ''

  @Watch('unitIndex')
  onUnitChanged () { this.logoError = false }

  @Watch('isTooltipOpen')
  onTooltipOpenChanged (open: boolean) {
    if (!open) return
    this.perGateReportCached = this.generatePerGateReport()
  }

  get vendorLogo (): string {
    return this.logoError
      ? 'HappyHare'
      : this.unitDetails(this.unitIndex).vendor
  }

  get vendorLogoUrl (): string {
    return `${import.meta.env.BASE_URL}img/mmu/mmu_${this.vendorLogo}.svg`
  }

  get mmuMachineUnit () {
    return this.unitDetails(this.unitIndex)
  }

  get unitDisplayName (): string {
    return `#${this.unitIndex + 1} ${this.mmuMachineUnit.name}`
  }

  get logoHeight (): number {
    if (this.numGates <= 8) return 44
    return 40
  }

  get showName (): boolean {
    return this.$typedState.config.uiSettings.mmu.showName
  }

  get showLogos (): boolean {
    return this.$typedState.config.uiSettings.mmu.showLogos
  }

  get showClimate (): boolean {
    return this.$typedState.config.uiSettings.mmu.showClimate
  }

  get showClimateIcons (): boolean {
    return this.mmuMachineUnit.numGates > 2
  }

  get printerSensors (): Sensor[] {
    return this.$typedGetters['printer/getSensors']
  }

  get unitHeaterObj () {
    const heaterKey = this.resolvePerGateName(
      this.mmuMachineUnit?.filamentHeaters,
      this.mmuMachineUnit?.filamentHeater
    )
    return heaterKey ? this.$store.state.printer.printer[heaterKey] : undefined
  }

  get unitClimateSensorObj () {
    const fullname = this.resolvePerGateName(
      this.mmuMachineUnit?.environmentSensors,
      this.mmuMachineUnit?.environmentSensor
    )
    return this.lookupSensorObj(fullname)
  }

  private lookupSensorObj (fullname: string | undefined) {
    if (!fullname) return undefined
    const parts = fullname!.split(' ')
    if (parts.length !== 2) return undefined
    const name = parts[1]

    return this.printerSensors.find(s => s.name === name)
  }

  get hasPerGateClimateSensors () {
    return !!this.mmuMachineUnit?.environmentSensors
  }

  get hasPerGateHeaters () {
    return !!this.mmuMachineUnit?.filamentHeaters
  }

  get unitDryingCycle (): boolean {
    const start = this.mmuMachineUnit.firstGate
    const end = this.mmuMachineUnit.firstGate + this.mmuMachineUnit.numGates

    return this.dryingState.slice(start, end).some((state) => state === this.DRYING_STATE_ACTIVE || state === this.DRYING_STATE_QUEUED)
  }

  get showPerGateReport (): boolean {
    return this.hasPerGateHeaters || this.hasPerGateClimateSensors
  }

  private generatePerGateReport (): string {
    const sensors = this.mmuMachineUnit?.environmentSensors
    const heaters = this.mmuMachineUnit?.filamentHeaters
    const isDrying = this.unitDryingCycle

    const gateLabel = this.$t('app.mmu.label.gate').toString()
    const dryingLabel = this.$t('app.mmu.label.drying').toString()
    const heaterLabel = this.$t('app.mmu.label.heater').toString()
    const queued = this.$t('app.mmu.label.drying_queued').toString()
    const complete = this.$t('app.mmu.label.drying_complete').toString()
    const cancelled = this.$t('app.mmu.label.drying_cancelled').toString()

    const lines: string[] = []
    for (let i = 0; i < this.mmuMachineUnit.numGates; i++) {
      const gate = this.mmuMachineUnit.firstGate + i
      const parts: string[] = []

      const fullname = sensors?.[i]
      const sensorObj = this.lookupSensorObj(this.stripQuotes(fullname))
      if (sensorObj) {
        const h = this.humidity(sensorObj)
        const t = this.temperature(sensorObj)
        if (h || t) parts.push([h, t].filter(Boolean).join('/'))
      }

      const heaterName = heaters?.[i]
      const heaterKey = this.stripQuotes(heaterName) ?? ''
      const heaterObj = heaterKey ? this.$store.state.printer.printer[heaterKey] : undefined
      if (heaterObj) {
        const state = this.dryingState?.[gate]
        if (isDrying) {
          if (state === this.DRYING_STATE_ACTIVE) parts.push(`${dryingLabel}: ${this.target(heaterObj) ?? ''}`.trim())
          else if (state === this.DRYING_STATE_QUEUED) parts.push(queued)
          else if (state === this.DRYING_STATE_COMPLETE) parts.push(complete)
          else if (state === this.DRYING_STATE_CANCELLED) parts.push(cancelled)
          else parts.push(`${heaterLabel}: ${this.target(heaterObj) ?? ''}`.trim())
        } else {
          parts.push(`${heaterLabel}: ${this.target(heaterObj) ?? ''}`.trim())
        }
      }

      lines.push(`${gateLabel} ${gate}: ${parts.join(', ')}`)
    }

    return lines.join('\n')
  }

  private formatMetric (obj: any, key: 'humidity' | 'temperature' | 'target', suffix: string) {
    const v = obj?.[key]
    return typeof v === 'number' ? `${v.toFixed(0)}${suffix}` : undefined
  }

  private humidity (obj: any) {
    return this.formatMetric(obj, 'humidity', '%')
  }

  private temperature (obj: any) {
    return this.formatMetric(obj, 'temperature', '°C')
  }

  private target (obj: any) {
    return this.formatMetric(obj, 'target', '°C')
  }

  private resolvePerGateName (perGate: string[] | undefined, single: string | undefined) {
    if (perGate) {
      const start = this.mmuMachineUnit.firstGate
      const end = start + this.mmuMachineUnit.numGates
      if (this.gate < start || this.gate >= end) return undefined
      return this.stripQuotes(perGate[this.gate - start])
    }
    return this.stripQuotes(single)
  }

  private stripQuotes (v?: string) {
    return v?.replace(/^"(.*)"$/, '$1')
  }

  get unitHeaterIcon () {
    if (this.unitDryingCycle) return '$mmuDryer'

    if (this.hasPerGateHeaters) {
      // Check all heaters on unit
      const heaters = this.mmuMachineUnit?.filamentHeaters
      for (let i = 0; i < this.mmuMachineUnit.numGates; i++) {
        const heaterName = heaters?.[i]
        const heaterKey = this.stripQuotes(heaterName) ?? ''
        const heaterObj = heaterKey ? this.$store.state.printer.printer[heaterKey] : undefined
        const raw = heaterObj?.target
        if (typeof raw === 'number' && raw > 0) return '$mmuHeater'
      }
    } else if (this.unitHeaterTemp) return '$mmuHeater'

    return undefined
  }

  get unitClimateHumidity () {
    if (this.hasPerGateClimateSensors && !this.unitClimateSensorObj) return '...'
    if (!this.unitClimateSensorObj) return undefined
    return this.formatMetric(this.unitClimateSensorObj, 'humidity', '%')
  }

  get unitClimateTemp () {
    if (this.hasPerGateClimateSensors && !this.unitClimateSensorObj) return '...'
    if (!this.unitClimateSensorObj) return undefined
    const value = this.formatMetric(this.unitClimateSensorObj, 'temperature', '°C')
    return value ? (this.hasPerGateClimateSensors ? `${value} ...` : value) : undefined
  }

  get unitHeaterTemp () {
    if (!this.unitHeaterObj && this.gate >= 0) return undefined
    if (!this.unitHeaterObj && this.hasPerGateHeaters) return '...'
    const raw = this.unitHeaterObj?.target
    if (typeof raw !== 'number' || raw <= 0) return undefined
    const value = this.formatMetric(this.unitHeaterObj, 'target', '°C')
    return value ? (this.hasPerGateHeaters ? `${value} ...` : value) : undefined
  }

  get footerClasses () {
    return {
      'footer-row': true,
      'footer-dark-theme': this.$vuetify.theme.dark,
      'footer-light-theme': !this.$vuetify.theme.dark,
    }
  }
}
</script>

<style scoped>
.footer-row {
   margin-left: -16px;
   margin-right: -16px;
}

.footer-light-theme {
    background: #f0f0f0;
}

.footer-dark-theme {
    background: #2c2c2c;
}

.mmu-logo {
    padding: 4px 12px 4px 0px;
    fill: currentColor;
    stroke: currentColor;
    opacity: 0.7;
}
</style>
