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
      <app-text-field
        v-model="inputValue"
        :type="type"
        :disabled="disabled || loading"
        :readonly="readonly"
        :prefix="prefix"
        :suffix="suffix"
        :rules="rules"
        class="v-input--text-right"
        dense
        single-line
        hide-details
        outlined
        v-on="$listeners"
      >
        <template #prepend>
          <app-btn
            v-if="resetValue !== undefined"
            :disabled="disabled"
            style="margin-top: -4px;"
            color=""
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
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins, Prop, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class AppNamedTextField extends Mixins(StateMixin) {
  @VModel({ })
    inputValue?: any

  @Prop({ type: String })
  readonly type?: string

  @Prop({ type: String, required: true })
  readonly label!: string

  @Prop({ type: [String, Number], required: false })
  readonly resetValue!: string | number

  @Prop({ type: Boolean, default: false })
  readonly readonly!: boolean

  @Prop({ type: Boolean, default: false })
  readonly disabled!: boolean

  @Prop({ type: Boolean, default: false })
  readonly loading!: boolean

  @Prop({ type: String })
  readonly prefix!: string

  @Prop({ type: String })
  readonly suffix!: string

  @Prop({ type: Array, default: () => { return [] } })
  readonly rules!: []

  handleReset () {
    if (this.resetValue !== undefined) {
      this.inputValue = this.resetValue

      this.$emit('submit', this.resetValue)
    }
  }
}
</script>
