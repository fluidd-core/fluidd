<template>
  <div>
    <v-row>
      <v-col class="pb-0 d-flex flex-row justify-space-between align-center">
        <h3 class="text-h6">
          <v-icon
            v-if="unitIcon"
            left
          >
            {{ unitIcon }}
          </v-icon>
          {{ unitNameOutput }}
        </h3>
        <v-spacer />
        <afc-card-unit-hub
          v-for="hub in hubs"
          :key="hub"
          :name="hub"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col class="d-flex flex-row flex-wrap afc-unit-container">
        <afc-card-unit-lane
          v-for="lane in lanes"
          :key="lane"
          :name="lane"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import AfcCardUnitHub from '@/components/widgets/afc/AfcCardUnitHub.vue'
import AfcCardUnitLane from '@/components/widgets/afc/AfcCardUnitLane.vue'
import type { AfcUnitKey, KlipperPrinterAfcUnitState, KlipperPrinterState } from '@/store/printer/types'

@Component({
  components: {
    AfcCardUnitHub,
    AfcCardUnitLane
  }
})
export default class AfcCardUnit extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true })
  readonly name!: string

  get unitType (): string {
    return this.name.substring(0, this.name.indexOf(' '))
      .replace(/_/g, '')
  }

  get unitName (): string {
    return this.name.substring(this.name.indexOf(' ') + 1)
  }

  get unitNameOutput (): string {
    return this.$filters.prettyCase(this.unitName)
  }

  get unit (): KlipperPrinterAfcUnitState | undefined {
    const printer: KlipperPrinterState = this.$typedState.printer.printer

    const unitObjectName = `AFC_${this.unitType} ${this.unitName}`
      .toLowerCase()

    const unitObjectKey = Object.keys(printer)
      .find((key): key is AfcUnitKey => key.toLowerCase() === unitObjectName)

    if (unitObjectKey != null) {
      return printer[unitObjectKey]
    }
  }

  get hubs (): string[] {
    return this.unit?.hubs ?? []
  }

  get lanes (): string[] {
    return this.unit?.lanes ?? []
  }

  get unitIcon (): string | null {
    if (!this.afcShowUnitIcons) {
      return null
    }

    switch (this.unitType.toLowerCase()) {
      case 'boxturtle':
        return '$afcIconBoxTurtle'
      case 'htlf':
        return '$afcIconHtlf'
      case 'nightowl':
        return '$afcIconNightOwl'
      case 'quattrobox':
        return '$afcIconQuattroBox'
      default:
        return null
    }
  }
}
</script>

<style scoped>
.afc-unit-container {
  gap: 16px;
}
</style>
