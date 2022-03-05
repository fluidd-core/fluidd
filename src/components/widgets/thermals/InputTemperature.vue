<template>
  <v-form
    v-model="valid"
    @submit.prevent
  >
    <v-layout>
      <v-text-field
        v-model.number="inputValue"
        outlined
        dense
        single-line
        hide-details="auto"
        :disabled="!klippyReady"
        :loading="loading"
        :rules="[rules.min, rules.max]"
        suffix="°C"
        class="v-input--width-x-small"
        @keyup.enter="emitChange"
        @focus="$event.target.select()"
      />
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
    min: (v: number | string) => (v >= this.min || v === '' || v === '0' || v === 0 || this.min === null) || this.$t('app.general.simple_form.error.min_or_0', { min: this.min }),
    max: (v: number | string) => (v <= this.max || v === '' || v === '0' || v === 0 || this.max === null) || this.$t('app.general.simple_form.error.max', { max: this.max })
  }

  emitChange () {
    if (this.valid) {
      if (!this.inputValue) this.inputValue = 0
      this.$emit('input', this.inputValue)
    }
  }

  mounted () {
    this.inputValue = this.value
  }
}
</script>
