<template>
  <v-expansion-panels
    accordion
    multiple
    flat
  >
    <v-expansion-panel
      v-for="extruderStepper in extruderSteppers"
      :key="`extruderStepper-${extruderStepper.name}`"
    >
      <v-divider />
      <v-expansion-panel-header>
        <template #actions>
          <v-icon
            small
            class="my-1 mr-2"
          >
            $expand
          </v-icon>
        </template>
        {{ $filters.startCase(extruderStepper.name) }}
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <pressure-advance-adjust
          :extruder-stepper="extruderStepper"
        />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import PressureAdvanceAdjust from './PressureAdvanceAdjust.vue'
import { ExtruderStepper } from '@/store/printer/types'

@Component({
  components: {
    PressureAdvanceAdjust
  }
})
export default class ExtruderSteppers extends Mixins(StateMixin) {
  get extruderSteppers () {
    const extruderSteppers = this.$store.getters['printer/getExtruderSteppers'] as ExtruderStepper[]
    return extruderSteppers
      .filter(x => x.pressure_advance !== undefined)
  }
}
</script>
