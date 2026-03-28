<template>
  <v-container>
    <v-row dense>
      <v-col
        v-for="index in unitArray"
        :key="index"
        cols="auto"
      >
        <div :class="unitClasses(index)">
          <mmu-unit
            :unit-index="index"
            :edit-gate-map="editGateMap"
            :edit-gate-selected="editGateSelected"
            :show-context-menu="showContextMenu"
            :show-details="showDetails"
            :hide-bypass="hideBypass"
            @select-gate="selectGate"
            @edit-filament="editFilament"
          />
        </div>
      </v-col>
      <v-col
        v-if="showStandaloneBypass && !hideBypass"
        key="bypass"
        cols="auto"
      >
        <div :class="unitClasses(-1)">
          <mmu-unit
            :unit-index="-1"
            :edit-gate-map="false"
            :show-context-menu="showContextMenu"
            :show-details="false"
            :show-footer="false"
            @select-gate="selectGate"
          />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'
import type { MmuGateDetails } from '@/types'
import MmuUnit from '@/components/widgets/mmu/MmuUnit.vue'

@Component({
  components: {
    MmuUnit
  }
})
export default class MmuMachine extends Mixins(StateMixin, MmuMixin) {
  @Prop({ required: false, default: null })
  readonly editGateMap!: MmuGateDetails[] | null

  @Prop({ required: false, default: -1 })
  readonly editGateSelected!: number

  @Prop({ required: false, default: true })
  readonly showContextMenu!: boolean

  @Prop({ required: false, default: true })
  readonly showDetails!: boolean

  @Prop({ required: false, default: false })
  readonly hideBypass!: boolean

  get unitArray (): number[] {
    return Array.from({ length: this.numUnits }, (_, k) => k)
  }

  unitClasses (index: number) {
    return {
      'mmu-unit': true,
      'mmu-unit-dark-theme': this.$vuetify.theme.dark,
      'mmu-unit-light-theme': !this.$vuetify.theme.dark,
      'mmu-unit-clear': index < 0
    }
  }

  get showStandaloneBypass () {
    for (let i = 0; i < this.numUnits; i++) {
      if (this.unitDetails(i).hasBypass) return false
    }
    return true
  }

  private selectGate (gate: number) {
    this.$emit('select-gate', gate)
  }

  private editFilament (gate: number) {
    this.$emit('edit-filament', gate)
  }
}
</script>

<style scoped>
.mmu-unit {
    overflow: hidden;
    margin-left: 4px;
    margin-right: 4px;
    padding-left: 16px;
    padding-right: 16px;
    border-radius: 32px 32px 8px 8px;
}

.mmu-unit-light-theme {
    background: #f0f0f0;
    box-shadow: inset 0px 4px 2px -4px #2c2c2c80;
}

.mmu-unit-dark-theme {
    background: #2c2c2c;
    box-shadow: inset 0px 4px 4px -4px #ffffff80;
}

.mmu-unit-clear {
    background: none !important;
    box-shadow: none !important;
}
</style>
