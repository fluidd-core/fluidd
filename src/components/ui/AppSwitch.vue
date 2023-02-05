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
      v-model="inputValue"
      class="mt-0"
      :disabled="disabled || loading"
      hide-details
    />
  </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Mixins, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class AppSwitch extends Mixins(StateMixin) {
  @VModel({ type: Boolean, required: true })
    inputValue!: boolean

  @Prop({ type: String, required: true })
  readonly label!: string

  @Prop({ type: Boolean, required: false, default: false })
  readonly disabled!: boolean

  @Prop({ type: Boolean, default: false })
  readonly loading!: boolean
}
</script>
