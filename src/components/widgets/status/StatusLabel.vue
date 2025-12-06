<template>
  <v-layout align-center>
    <span
      class="label body-2 secondary--text"
      :style="{
        width: $filters.getPixelsString(labelWidth),
        'min-width': $filters.getPixelsString(labelWidth)
      }"
      v-html="label"
    />
    <span class="value"><slot /></span>
    <span
      v-if="!$slots.default"
      class="value"
    >--</span>
  </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class AppSwitch extends Mixins(StateMixin) {
  @Prop({ type: String, required: true })
  readonly label!: string

  @Prop({ type: [String, Number], default: 80 })
  readonly labelWidth!: string | number
}
</script>

<style lang="scss" scoped>
  .layout {
    margin: 0 0 2px 0;
  }

  span.value {
    > span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
</style>
