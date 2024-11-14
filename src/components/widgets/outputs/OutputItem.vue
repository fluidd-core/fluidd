<template>
  <div>
    <output-pin
      v-if="pinTypes.includes(item.type)"
      :key="item.key"
      :pin="item"
    />

    <output-fan
      v-if="fanTypes.includes(item.type)"
      :key="item.key"
      :fan="item"
    />

    <output-led
      v-if="ledTypes.includes(item.type)"
      :key="item.key"
      :led="item"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import OutputFan from '@/components/widgets/outputs/OutputFan.vue'
import OutputPin from '@/components/widgets/outputs/OutputPin.vue'
import OutputLed from '@/components/widgets/outputs/OutputLed.vue'
import type { Fan, Led, OutputPin as IOutputPin } from '@/store/printer/types'

@Component({
  components: {
    OutputFan,
    OutputPin,
    OutputLed
  }
})
export default class Outputs extends Vue {
  @Prop({ type: Object, required: true })
  readonly item!: Fan | Led | IOutputPin

  get pinTypes () {
    return [
      'output_pin',
      'pwm_tool',
      'pwm_cycle_time'
    ]
  }

  get fanTypes () {
    return [
      'temperature_fan',
      'controller_fan',
      'heater_fan',
      'fan_generic',
      'fan'
    ]
  }

  get ledTypes () {
    return [
      'led',
      'neopixel',
      'dotstar',
      'pca9533',
      'pca9632'
    ]
  }
}
</script>
