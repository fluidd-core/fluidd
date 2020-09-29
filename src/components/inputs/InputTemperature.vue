<template>
  <v-text-field
    solo
    dense
    hide-details="auto"
    :height="36"
    :value="value"
    :loading="loading"
    :rules="[rules.max, rules.min]"
    @input="updateValue"
    @update:error="onError"
    @keyup.enter="emitChange(newValue)"
    label="target"
    type="number"
    suffix="℃"
    class="v-text-field-outer-btn">
    <template v-slot:append-outer>
      <v-btn
        :min-width="40"
        :disabled="(value === newValue) || invalid"
        class="pa-0"
        :color="(value === newValue) ? 'secondary' : 'primary'"
        @click="emitChange(newValue)">
        <v-icon small>mdi-check</v-icon>
      </v-btn>
    </template>
  </v-text-field>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component({})
export default class InputTemperature extends Vue {
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
    this.newValue = val
  }

  newValue = 0;
  invalid = false

  rules = {
    min: (v: number | string) => (v >= this.min || v === '0' || v === 0 || this.min === null) || 'Min ' + this.min + ' or 0.',
    max: (v: number | string) => (v <= this.max || v === '0' || v === 0 || this.min === null) || 'Max ' + this.max
  }

  onError (invalid: boolean) {
    this.invalid = invalid
  }

  updateValue (e: string) {
    this.newValue = parseInt(e)
  }

  emitChange (val: number) {
    if (!this.invalid) {
      this.$emit('input', val)
    }
  }

  mounted () {
    this.newValue = this.value
  }
}
</script>

<style lang="scss">
</style>
