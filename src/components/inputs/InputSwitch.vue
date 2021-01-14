<template>
  <v-layout justify-space-between align-end>
    <div
      class="grey--text text--darken-1 font-weight-regular"
    >
      {{ label }}
    </div>
    <v-switch
      class="mt-0"
      :input-value="value"
      :disabled="disabled"
      hide-details
      @change="emitChange"
      flat
    >
    </v-switch>
  </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Watch, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({})
export default class InputSlider extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, required: true })
  public value!: boolean

  @Prop({ type: String, required: true })
  public label!: string

  @Prop({ type: Boolean, required: false, default: false })
  public disabled!: boolean

  @Watch('value')
  onValueChange (val: boolean) {
    this.newValue = val
  }

  newValue = false

  mounted () {
    this.newValue = this.value
  }

  updateValue (e: boolean) {
    this.newValue = e
  }

  emitChange (val: boolean) {
    this.$emit('input', val)
  }
}
</script>
