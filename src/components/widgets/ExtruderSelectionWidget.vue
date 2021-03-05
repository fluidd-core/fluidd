<template>
  <v-select
    :items="extruders"
    :readonly="printerPrinting"
    v-model="extruder"
    item-value="key"
    item-text="name"
    hide-details
    outlined
    dense
    class="mb-2 v-input--x-dense"
    style="max-width: 256px;"
  ></v-select>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'

@Component({
  components: {}
})
export default class ExtruderSelectionWidget extends Mixins(UtilsMixin) {
  get extruders () {
    return this.$store.getters['socket/getExtruders']
  }

  get extruder () {
    return this.$store.state.socket.printer.toolhead.extruder
  }

  set extruder (extruder: string) {
    this.sendGcode(`ACTIVATE_EXTRUDER EXTRUDER=${extruder}`, Waits.onExtruderChange)
  }
}
</script>
