<template>
<div>
  <div class="d-flex justify-start">
    <div class="grey--text text--darken-1 align-self-end">{{ label }}</div>
    <div class="grey--text text-h5 ml-auto" :class="{ 'text--darken-2': disabled, 'text--lighten-1': !disabled }">{{ newValue.toFixed() }}%</div>
  </div>
  <v-slider
    @change="emitChange(newValue)"
    @input="updateValue"
    :value="value"
    :min="min"
    :max="max"
    :readonly="readonly"
    :disabled="disabled"
    :loading="loading"
    :thumb-label="false"
    dense
    hide-details
  >
    <template v-slot:prepend>
      <v-btn
        :disabled="readonly || disabled"
        @click="emitChange(newValue - 1)"
        :min-width="40"
        class="pa-0"
        small
        color="secondary">
        <v-icon color="grey lighten-2">
          {{ icons.minus }}
        </v-icon>
      </v-btn>
    </template>

    <template v-slot:append>
      <v-btn
        :disabled="readonly || disabled"
        @click="emitChange(newValue + 1)"
        :min-width="40"
        class="pa-0"
        small
        color="secondary">
        <v-icon color="grey lighten-2">
          {{ icons.plus }}
        </v-icon>
      </v-btn>
    </template>
  </v-slider>
</div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({})
export default class InputSlider extends Mixins(UtilsMixin) {
  @Prop({ type: Number, required: true })
  public value!: number

  @Prop({ type: String, required: true })
  public label!: string

  @Prop({ type: Boolean, required: false, default: false })
  public readonly!: boolean

  @Prop({ type: Boolean, required: false, default: false })
  public disabled!: boolean

  @Prop({ type: Boolean, required: false, default: false })
  public loading!: boolean

  @Prop({ type: Number, default: 0 })
  public min!: number;

  @Prop({ type: Number, default: 100 })
  public max!: number;

  @Watch('value')
  onValueChange (val: number) {
    this.newValue = val
  }

  newValue = 0;

  updateValue (e: string) {
    this.newValue = parseInt(e)
  }

  emitChange (val: number) {
    this.$emit('input', val)
  }

  mounted () {
    this.newValue = this.value
  }
}
</script>

<style lang="scss">
</style>
