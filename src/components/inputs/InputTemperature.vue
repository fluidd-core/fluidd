<template>
  <v-form v-model="valid" @submit.prevent>
    <v-layout>
      <v-text-field
        outlined
        dense
        single-line
        hide-details="auto"
        v-model.number="inputValue"
        :disabled="!klippyReady"
        :loading="loading"
        :rules="[rules.max, rules.min]"
        @keyup.enter="emitChange"
        @focus="$event.target.select()"
        suffix="°C"
        class="mr-1 v-input--width-small">
      </v-text-field>
      <btn
        :min-width="40"
        :disabled="(value === inputValue) || !valid"
        class="pa-0"
        :color="(value === inputValue) ? 'secondary' : 'primary'"
        @click.prevent="emitChange">
        <v-icon small>$check</v-icon>
      </btn>
    </v-layout>
  </v-form>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class InputTemperature extends Mixins(StateMixin) {
  @Prop({ type: Number, required: true })
  public value!: number

  @Prop({ type: Number, default: null })
  public max!: number;

  @Prop({ type: Number, default: null })
  public min!: number;

  @Prop({ type: Boolean, default: false })
  public loading!: boolean;

  @Watch('value')
  onValueChange (val: number) {
    this.inputValue = val
  }

  valid = true
  inputValue = 0;

  rules = {
    min: (v: number | string) => (v >= this.min || v === '0' || v === 0 || this.min === null) || 'Min ' + this.min + ' or 0.',
    max: (v: number | string) => (v <= this.max || v === '0' || v === 0 || this.min === null) || 'Max ' + this.max
  }

  emitChange () {
    if (this.valid) {
      this.$emit('input', this.inputValue)
    }
  }

  mounted () {
    this.inputValue = this.value
  }
}
</script>
