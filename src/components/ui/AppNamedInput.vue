<template>
  <v-row
    no-gutters
    justify-space-between
  >
    <v-col
      align-self="center"
      cols="5"
      class="text-body-1 py-0"
      :class="{ 'disabled--text': disabled }"
    >
      {{ label }}
    </v-col>
    <v-col class="ml-auto py-0">
      <v-text-field
        :value="value"
        :disabled="disabled"
        :readonly="readonly"
        :suffix="suffix"
        :rules="rules"
        :loading="loading"
        class="v-input--text-right"
        dense
        single-line
        hide-details
        outlined
        @input="$emit('input', $event)"
        @change="handleChange"
        @focus="$event.target.select()"
      >
        <template v-slot:prepend>
          <app-btn
            v-if="resetValue"
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
      </v-text-field>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class AppNamedInput extends Mixins(StateMixin) {
  @Prop({ type: [String, Number], required: true })
  public value!: string | number;

  @Prop({ type: String, required: true })
  public label!: string

  @Prop({ type: [String, Number], required: false })
  public resetValue!: string | number;

  @Prop({ type: Boolean, default: false })
  public readonly!: boolean

  @Prop({ type: Boolean, default: false })
  public disabled!: boolean

  @Prop({ type: Boolean, default: false })
  public loading!: boolean

  @Prop({ type: String })
  public suffix!: string;

  @Prop({ type: Array, default: () => { return [] } })
  public rules!: []

  handleChange (value: string | number) {
    if (this.value !== value) this.$emit('change', value)
  }

  handleReset () {
    this.$emit('input', this.resetValue)
    if (this.value !== this.resetValue) this.$emit('change', this.resetValue)
  }
}
</script>
