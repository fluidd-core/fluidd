<template>
  <v-card-text>
    <v-row>
      <v-col cols="6">
        <div v-for="(item, i) in all.col1" :key="i">
          <output-pin-widget
            v-if="item.type === 'output_pin'"
            :pin="item"
            :divider="(i < all.col1.length -1)"
          >
          </output-pin-widget>
          <fan-widget
            v-if="item.type !== 'output_pin'"
            :fan="item"
            :divider="(i < all.col1.length -1)"
          ></fan-widget>
        </div>
      </v-col>
      <v-col cols="6">
        <div v-for="(item, i) in all.col2" :key="i">
          <output-pin-widget
            v-if="item.type === 'output_pin'"
            :pin="item"
            :divider="(i < all.col2.length -1)"
          >
          </output-pin-widget>
          <fan-widget
            v-if="item.type !== 'output_pin'"
            :fan="item"
            :divider="(i < all.col2.length -1)"
          ></fan-widget>
        </div>
      </v-col>
    </v-row>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FanWidget from '@/components/widgets/FanWidget.vue'
import OutputPinWidget from '@/components/widgets/OutputPinWidget.vue'
import UtilsMixin from '@/mixins/utils'
import { Fan, OutputPin } from '@/store/socket/types'

@Component({
  components: {
    FanWidget,
    OutputPinWidget
  }
})
export default class OutputsWidget extends Mixins(UtilsMixin) {
  get all () {
    const items: Array<Fan | OutputPin> = [
      ...this.$store.getters['socket/getAllFans'],
      ...this.$store.getters['socket/getPins']
    ]
    let col1: Array<Fan | OutputPin> = []
    let col2: Array<Fan | OutputPin> = []
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
