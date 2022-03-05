<template>
  <v-layout align-center>
    <span
      class="label body-2 secondary--text"
      :style="`width: ${labelWidth}; min-width: ${labelWidth};`"
      v-html="label"
    />
    <span class="value"><slot /></span>
    <span
      v-if="!this.$slots.default"
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
  public label!: string

  @Prop({ type: [String, Number], default: '70px' })
  public labelWidth!: string | number
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
