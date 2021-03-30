<template>
  <v-card-text>
    <v-row>
      <v-col cols="12" md="6">
        <div v-for="(item, i) in all.col1" :key="i">
          <output-pin
            v-if="item.type === 'output_pin'"
            :pin="item"
            :divider="(i < all.col1.length -1)"
          >
          </output-pin>
          <fan-item
            v-if="item.type !== 'output_pin'"
            :fan="item"
            :divider="(i < all.col1.length -1)"
          ></fan-item>
        </div>
      </v-col>
      <v-col cols="12" md="6">
        <div v-for="(item, i) in all.col2" :key="i">
          <output-pin
            v-if="item.type === 'output_pin'"
            :pin="item"
            :divider="(i < all.col2.length -1)"
          >
          </output-pin>
          <fan-item
            v-if="item.type !== 'output_pin'"
            :fan="item"
            :divider="(i < all.col2.length -1)"
          ></fan-item>
        </div>
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FanItem from '@/components/widgets/outputs/FanItem.vue'
import OutputPin from '@/components/widgets/outputs/OutputPin.vue'
import StateMixin from '@/mixins/state'
import { Fan as IFan, OutputPin as IOutputPin } from '@/store/printer/types'

@Component({
  components: {
    FanItem,
    OutputPin
  }
})
export default class Outputs extends Mixins(StateMixin) {
  get all () {
    const items: Array<IFan | IOutputPin> = [
      ...this.$store.getters['printer/getAllFans'],
      ...this.$store.getters['printer/getPins']
    ]
    let col1: Array<IFan | IOutputPin> = []
    let col2: Array<IFan | IOutputPin> = []
    if (items.length > 1) {
      const half = Math.ceil(items.length / 2)
      col1 = items.splice(0, half)
      col2 = items
    } else {
      col1 = items
    }
    return {
      col1,
      col2
    }
  }
}
</script>
