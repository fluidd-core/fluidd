<template>
  <v-layout
    justify-space-between
    align-center
  >
    <div
      class="text-body-1"
      :class="{ 'text--disabled': disabled }"
      v-html="label"
    />
    <v-switch
      v-model="inputValue"
      class="mt-0"
      :disabled="disabled || loading"
      :true-value="trueValue"
      :false-value="falseValue"
      hide-details
      v-on="$listeners"
    />
  </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Vue, VModel } from 'vue-property-decorator'

@Component({})
export default class AppNamedSwitch extends Vue {
  @VModel({ type: Boolean })
  inputValue?: boolean

  @Prop({ type: String, required: true })
  readonly label!: string

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: Boolean })
  readonly loading?: boolean

  @Prop({ })
  readonly trueValue?: unknown

  @Prop({ })
  readonly falseValue?: unknown
}
</script>
