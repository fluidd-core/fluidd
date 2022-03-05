<template>
  <div>
    <output-pin
      v-if="item.type === 'output_pin'"
      :key="item.key"
      :pin="item"
    />

    <output-fan
      v-if="fanTypes.includes(item.type)"
      :key="item.key"
      :fan="item"
    />

    <output-led
      v-if="item.type === 'neopixel' || item.type === 'dotstar'"
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
// import { Fan, OutputPin } from '@/store/printer/types'

@Component({
  components: {
    OutputFan,
    OutputPin,
    OutputLed
  }
})
export default class Outputs extends Vue {
  @Prop({ type: Object, required: true })
  item!: object

  get fanTypes () {
    return [
      'temperature_fan',
      'controller_fan',
      'heater_fan',
      'fan_generic',
      'fan'
    ]
  }
}
</script>
