<template>
  <v-select
    v-model="extruder"
    :items="extruders"
    :readonly="printerPrinting"
    :disabled="!klippyReady || printerPrinting"
    item-value="key"
    item-text="name"
    hide-details
    outlined
    dense
    class="mb-2 v-input--x-dense"
    style="max-width: 256px;"
  />
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'
import type { KnownExtruder } from '@/store/printer/types'

@Component({})
export default class ExtruderSelection extends Mixins(StateMixin) {
  get extruders (): KnownExtruder[] {
    return this.$store.getters['printer/getExtruders']
  }

  get extruder (): string {
    return this.$store.state.printer.printer.toolhead.extruder
  }

  set extruder (extruder: string) {
    this.sendGcode(`ACTIVATE_EXTRUDER EXTRUDER=${encodeGcodeParamValue(extruder)}`, this.$waits.onExtruderChange)
  }
}
</script>
