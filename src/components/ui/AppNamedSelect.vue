<template>
  <v-row no-gutters>
    <v-col
      cols="12"
      sm="5"
      align-self="center"
      class="text-body-1"
      :class="{ 'text--disabled': disabled }"
      v-html="label"
    />
    <v-col>
      <v-select
        v-model="inputValue"
        class="mt-0"
        :items="items"
        :disabled="disabled || loading"
        :prefix="prefix"
        :suffix="suffix"
        :item-value="itemValue"
        :item-text="itemText"
        :return-object="returnObject"
        dense
        single-line
        outlined
        hide-details
        v-on="$listeners"
      >
        <template #prepend>
          <app-btn
            v-if="resetValue !== undefined"
            :disabled="disabled"
            style="margin-top: -4px;"
            icon
            small
            @click="handleReset"
          >
            <v-icon small>
              $reset
            </v-icon>
          </app-btn>
        </template>
      </v-select>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Prop, Vue, VModel } from 'vue-property-decorator'

@Component({
  inheritAttrs: false
})
export default class AppNamedSelect extends Vue {
  @VModel({ })
  inputValue?: unknown

  @Prop({ })
  readonly resetValue?: unknown

  @Prop({ type: Array })
  readonly items?: unknown[]

  @Prop({ type: String, required: true })
  readonly label!: string

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: Boolean })
  readonly loading?: boolean

  @Prop({ type: String })
  readonly prefix?: string

  @Prop({ type: String })
  readonly suffix?: string

  @Prop({ type: String })
  readonly itemValue?: string

  @Prop({ type: String })
  readonly itemText?: string

  @Prop({ type: Boolean })
  readonly returnObject?: boolean

  handleReset () {
    if (this.resetValue !== undefined) {
      this.$emit('change', this.resetValue)
    }
  }
}
</script>
