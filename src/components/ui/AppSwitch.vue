<template>
  <v-layout
    justify-space-between
    align-center
  >
    <div
      class="text-body-1"
      :class="{ 'text--disabled': disabled }"
    >
      {{ label }}
    </div>
    <v-switch
      class="mt-0"
      :input-value="value"
      :disabled="disabled || loading"
      hide-details
      @change="emitChange"
    />
  </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class AppSwitch extends Mixins(StateMixin) {
  @Prop({ type: Boolean, required: true })
  readonly value!: boolean

  @Prop({ type: String, required: true })
  readonly label!: string

  @Prop({ type: Boolean, required: false, default: false })
  readonly disabled!: boolean

  @Prop({ type: Boolean, default: false })
  readonly loading!: boolean

  emitChange (val: boolean) {
    this.$emit('input', val)
  }
}
</script>
