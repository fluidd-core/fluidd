<template>
  <v-list-item
    :lines="lines"
    :class="{ 'disabled-panel': details.status === 0 }"
  >
    <v-list-item-content :class="contentClass">
      <div :class="toplineClass">
        {{ title }}
      </div>
      <v-list-item-title :class="titleClass">
        {{ name }}
      </v-list-item-title>
      <v-list-item-subtitle :class="subtitleClass">
        {{ subtitle }}
      </v-list-item-subtitle>
      <v-list-item-subtitle
        v-if="showDetails"
        :class="detailsClass"
      >
        {{ extra }}
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'
import type { MmuGateDetails } from '@/types'

@Component({})
export default class MmuGateSummary extends Mixins(StateMixin, MmuMixin) {
  @Prop({ required: true, default: -1 })
  readonly gateIndex!: number

  @Prop({ required: false, default: false })
  readonly compact!: boolean

  @Prop({ required: false, default: true })
  readonly showDetails!: boolean

  @Prop({ required: false, default: true })
  readonly showGate!: boolean

  get details (): MmuGateDetails {
    return this.gateDetails(this.gateIndex)
  }

  get lines (): string {
    if (this.showDetails) return 'three'
    return 'two'
  }

  get title (): string {
    return [this.showGate ? this.gateText(this.gate) : null, this.vendorText].filter((v) => v !== null).join(' | ')
  }

  get name (): string {
    return this.details.filamentName
  }

  get subtitle (): string {
    return [this.details.material, this.temperatureText, this.speedOverrideText]
      .filter((v) => v !== null)
      .join(' | ')
  }

  get extra (): string {
    const text = [this.spoolIdText, this.weightText, this.lengthText].filter((v) => v !== null).join(' | ')
    if (!text) return 'No spool ID'
    return text
  }

  get speedOverrideText (): string | null {
    if (this.details.speedOverride === 100) return null
    return 'Speed: ' + this.details.speedOverride + '%'
  }

  get temperatureText (): string | null {
    if (this.details.temperature <= 0) return null
    return this.details.temperature + '\u00B0' + 'C'
  }

  get spoolIdText (): string | null {
    if (!this.details.spoolId || this.details.spoolId <= 0) return null
    return 'Spool ID: #' + this.details.spoolId
  }

  // Only available with Spoolman...

  get vendorText () {
    const spoolmanSpool = this.spoolmanSpool(this.details.spoolId)
    return spoolmanSpool?.filament?.vendor?.name ?? 'Unknown'
  }

  get weightText () {
    const spoolmanSpool = this.spoolmanSpool(this.details.spoolId)
    const remaining = spoolmanSpool?.remaining_weight ?? null
    // Technically this is what spoolman implements but not available in Fluidd:
    //   const total = spoolmanSpool?.initial_weight ?? spoolmanSpool?.filament?.weight ?? null
    const total = spoolmanSpool?.filament?.weight ?? null
    if (remaining === null || total === null) return null

    if (total >= 1000) {
      let totalRound = Math.floor(total / 1000)
      if (totalRound !== total / 1000) {
        totalRound = Math.round(total / 100) / 10
      }
      return `${Math.round(remaining)}g / ${totalRound}kg`
    }
    return `${Math.round(remaining)} / ${Math.round(total)}g`
  }

  get lengthText () {
    const spoolmanSpool = this.spoolmanSpool(this.details.spoolId)
    const remaining = spoolmanSpool?.remaining_length ?? null
    if (remaining === null) return null
    return `${Math.round(remaining / 1000)}m`
  }

  get contentClass () {
    if (this.compact) return ['my-0', 'smaller-font']
    return 'my-0'
  }

  get toplineClass () {
    if (this.compact) return ['text-overline', 'mb-1', 'reduced-line-height', 'small-overline-font']
    return ['text-overline', 'reduced-line-height', 'mb-2']
  }

  get titleClass () {
    if (this.compact) return ['text-h7', 'mb-1']
    return ['text-h6', 'mb-1']
  }

  get subtitleClass () {
    if (this.compact) return ['subtitle-container', ' smaller-font']
    return ['subtitle-container']
  }

  get detailsClass () {
    if (this.compact) return ['subtitle-container', ' smaller-font']
    return ['subtitle-container', 'smaller-font']
  }
}
</script>

<style scoped>
.reduced-line-height {
    line-height: 1em;
}

.subtitle-container {
    display: flex;
    justify-content: space-between;
    width: 100%;
}

.smaller-font {
    font-size: 0.8em;
}

.small-overline-font {
    line-height: 0.7em;
    font-size: 0.7em !important;
}

.disabled-panel {
    opacity: 0.5;
}
</style>
