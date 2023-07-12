<template>
  <v-row>
    <v-col
      cols="12"
      sm="6"
    >
      <app-named-select
        :value="extruderStepper.motion_queue"
        :label="$t('app.general.label.synced_extruder')"
        :items="[
          { name: $t('app.setting.label.none'), key: null },
          ...availableExtruders
        ]"
        :disabled="!klippyReady || printerPrinting"
        :loading="hasWait(`${$waits.onSyncExtruder}${extruderStepper.name}`)"
        :reset-value="extruderStepper.config.extruder"
        item-value="key"
        item-text="name"
        @change="sendSyncExtruderMotion"
      />
    </v-col><v-col
      v-if="extruderStepper.enabled !== undefined"
      cols="12"
      sm="6"
    >
      <app-named-switch
        :value="extruderStepper.enabled"
        :label="$t('app.general.label.stepper_enabled')"
        :disabled="!klippyReady || printerPrinting"
        :loading="hasWait(`${$waits.onStepperEnable}${extruderStepper.name}`)"
        @change="sendSetStepperEnable"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { KnownExtruder, ExtruderStepper } from '@/store/printer/types'

@Component({})
export default class ExtruderStepperSync extends Mixins(StateMixin) {
  @Prop({ type: Object, required: true })
  readonly extruderStepper!: ExtruderStepper

  get availableExtruders () {
    return this.$store.getters['printer/getExtruders'] as KnownExtruder[]
  }

  sendSyncExtruderMotion (value: string | null) {
    this.sendGcode(`SYNC_EXTRUDER_MOTION EXTRUDER=${this.extruderStepper.name} MOTION_QUEUE=${value ?? ''}`, `${this.$waits.onSyncExtruder}${this.extruderStepper.name}`)
  }

  sendSetStepperEnable (value: boolean) {
    this.sendGcode(`SET_STEPPER_ENABLE STEPPER="${this.extruderStepper.key}" ENABLE=${+value}`, `${this.$waits.onStepperEnable}${this.extruderStepper.name}`)
  }
}
</script>
