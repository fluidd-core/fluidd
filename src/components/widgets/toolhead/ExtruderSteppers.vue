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
        <template #default="{ open }">
          <v-fade-transition leave-absolute>
            <span
              v-if="open"
              key="0"
            >
              {{ extruderStepper.prettyName }}
            </span>
            <span
              v-else
              key="1"
            >
              {{ extruderStepper.prettyName }} <span class="secondary--text">[ {{ extruderStepper.description }} ]</span>
            </span>
          </v-fade-transition>
        </template>
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <extruder-stepper-sync
          :extruder-stepper="extruderStepper"
        />

        <pressure-advance-adjust
          v-if="extruderStepper.pressure_advance !== undefined"
          :extruder-stepper="extruderStepper"
        />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ExtruderStepperSync from './ExtruderStepperSync.vue'
import PressureAdvanceAdjust from './PressureAdvanceAdjust.vue'
import type { KnownExtruder, ExtruderStepper } from '@/store/printer/types'

@Component({
  components: {
    ExtruderStepperSync,
    PressureAdvanceAdjust
  }
})
export default class ExtruderSteppers extends Vue {
  get extruderSteppers () {
    const extruders = this.$store.getters['printer/getExtruders'] as KnownExtruder[]
    const extruderSteppers = this.$store.getters['printer/getExtruderSteppers'] as ExtruderStepper[]

    return extruderSteppers
      .map(x => {
        const motionQueueName = (x.motion_queue && extruders.find(y => y.key === x.motion_queue)?.name) ?? this.$t('app.setting.label.none')
        const enabledDesc = x.enabled !== undefined && this.$t(`app.general.label.${x.enabled ? 'on' : 'off'}`)
        const description = enabledDesc ? `${motionQueueName}, ${enabledDesc}` : motionQueueName

        return {
          ...x,
          description
        }
      })
  }
}
</script>
