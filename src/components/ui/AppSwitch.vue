<template>
  <v-layout
    justify-space-between
    align-center
  >
    <div
      class="text-body-1"
    >
      {{ label }}
    </div>
    <v-switch
      class="mt-0"
      :input-value="value"
      :disabled="disabled"
      hide-details
      @change="emitChange"
    />
  </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Watch, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class AppSwitch extends Mixins(StateMixin) {
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
