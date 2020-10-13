<template>
  <v-row>
    <!-- Fans -->
    <v-col class="pa-2 pt-4 pb-0">
      <input-slider
        label="Part Fan"
        :value="partFanSpeed"
        :disabled="!klippyConnected"
        @input="setPartFanSpeed($event)"
        :readonly="printerPrinting">
      </input-slider>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import InputSlider from '@/components/inputs/InputSlider.vue'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    InputSlider
  }
})
export default class FansWidget extends Mixins(UtilsMixin) {
  get partFanSpeed () {
    return this.$store.state.socket.printer.fan.speed * 100
  }

  setPartFanSpeed (target: number) {
    target = Math.ceil(target * 2.55)
    this.sendGcode(`M106 S${target}`)
  }
}
</script>

<style type="scss" scoped>

</style>
