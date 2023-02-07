<template>
  <v-row no-gutters>
    <v-col
      cols="12"
      sm="5"
      align-self="center"
      class="text-body-1 py-0"
      :class="{ 'text--disabled': disabled }"
      v-html="label"
    />
    <v-col class="py-0">
      <v-select
        v-model="inputValue"
        class="mt-0"
        :items="items"
        :disabled="disabled || loading"
        :suffix="suffix"
        :item-value="itemValue"
        :item-text="itemText"
        :return-object="returnObject"
        dense
        single-line
        outlined
        hide-details
        v-on="$listeners"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Prop, Vue, VModel } from 'vue-property-decorator'

@Component({})
export default class AppSelect extends Vue {
  @VModel({ })
    inputValue?: any

  @Prop({ type: Array })
  readonly items?: any[]

  @Prop({ type: String, required: true })
  readonly label!: string

  @Prop({ type: Boolean, default: false })
  readonly disabled!: boolean

  @Prop({ type: Boolean, default: false })
  readonly loading!: boolean

  @Prop({ type: String })
  readonly suffix?: string

  @Prop({ type: String })
  readonly itemValue?: string

  @Prop({ type: String })
  readonly itemText?: string

  @Prop({ type: Boolean })
  readonly returnObject?: boolean
}
</script>
