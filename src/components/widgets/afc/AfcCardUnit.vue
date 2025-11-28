<template>
  <div>
    <v-row>
      <v-col class="pb-0 d-flex flex-row justify-space-between align-center">
        <h3 class="text-h6">
          <v-icon
            v-if="modulIcon"
            left
          >
            {{ modulIcon }}
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
import Vue from 'vue'
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import AfcCardUnitHub from '@/components/widgets/afc/AfcCardUnitHub.vue'
import AfcCardUnitLane from '@/components/widgets/afc/AfcCardUnitLane.vue'
import { afcIconBoxTurtle, afcIconHtlf, afcIconNightOwl, afcIconQuattroBox } from '@/plugins/afcIcons'

@Component({
  components: {
    AfcCardUnitHub,
    AfcCardUnitLane
  }
})
export default class AfcCardUnit extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true }) readonly name!: string

  get unitName () {
    return this.name.substring(this.name.indexOf(' ') + 1)
  }

  get unitNameOutput () {
    return Vue.$filters.prettyCase(this.unitName)
  }

  get unit () {
    const printer = this.$typedState.printer.printer ?? {}
    const moduleName = this.name.substring(0, this.name.indexOf(' ')).replace('_', '')
    const unitObjectName = `AFC_${moduleName} ${this.unitName}`.toLowerCase()
    const objectName = Object.keys(printer).find((key) => key.toLowerCase() === unitObjectName) ?? ''

    return printer[objectName] ?? {}
  }

  get hubs () {
    const hubs = this.unit.hubs ?? []
    return hubs
  }

  get lanes () {
    return this.unit.lanes ?? []
  }

  get type () {
    const moduleName = this.name.substring(0, this.name.indexOf(' ')).replace('_', '')

    return moduleName.toLowerCase()
  }

  get modulIcon () {
    if (!this.afcShowUnitIcons) return null

    switch (this.type) {
      case 'boxturtle':
        return afcIconBoxTurtle
      case 'htlf':
        return afcIconHtlf
      case 'nightowl':
        return afcIconNightOwl
      case 'quattrobox':
        return afcIconQuattroBox
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
