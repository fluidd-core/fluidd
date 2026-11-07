<template>
  <app-named-container
    :label="label"
    :disabled="disabled"
  >
    <template
      v-if="$scopedSlots.label"
      #label
    >
      <slot name="label" />
    </template>

    <app-text-field
      v-model="inputValue"
      :disabled="disabled || loading"
      class="v-input--text-right"
      dense
      single-line
      hide-details
      outlined
      v-bind="$attrs"
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
    </app-text-field>
  </app-named-container>
</template>

<script lang="ts">
import { Component, Mixins, Prop, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({
  inheritAttrs: false
})
export default class AppNamedTextField extends Mixins(StateMixin) {
  @VModel({ })
  inputValue?: unknown

  @Prop({ type: String })
  readonly label?: string

  @Prop({ })
  readonly resetValue?: unknown

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: Boolean })
  readonly loading?: boolean

  handleReset () {
    if (this.resetValue !== undefined) {
      this.inputValue = this.resetValue

      this.$emit('submit', this.resetValue)
    }
  }
}
</script>
