<template>
  <v-layout
    justify-space-between
    align-center
  >
    <div
      class="text-body-1"
      :class="{ 'text--disabled': disabled }"
    >
      <slot name="label">
        <span class="text-pre-wrap">{{ label }}</span>
      </slot>
    </div>
    <v-switch
      v-model="inputValue"
      class="mt-0"
      :disabled="disabled || loading"
      hide-details
      v-bind="$attrs"
      v-on="$listeners"
    />
  </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Vue, VModel } from 'vue-property-decorator'

@Component({
  inheritAttrs: false
})
export default class AppNamedSwitch extends Vue {
  @VModel({ type: Boolean })
  inputValue?: boolean

  @Prop({ type: String })
  readonly label?: string

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: Boolean })
  readonly loading?: boolean
}
</script>
