<template>
  <v-form ref="form" id="form">
    <v-layout align-end>
      <div class="grey--text text--darken-1 font-weight-regular">{{ label }}</div>
      <div class="grey--text focus--text ml-auto" :class="{ 'text--darken-2': disabled, 'text--lighten-1': !disabled }">{{ newValue.toFixed() }}<small>{{valueSuffix}}</small></div>
    </v-layout>
    <v-slider
      v-if="!readonly"
      @change="emitChange"
      @input="updateValue"
      :value="newValue"
      :rules="rules"
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
        <v-icon
          :disabled="readonly || disabled || newValue === 0"
          @click="clickChange(newValue - 1)"
          color="grey lighten-2">
          $minus
        </v-icon>
      </template>

      <template v-slot:append>
        <v-icon
          :disabled="readonly || disabled || newValue === max"
          @click="clickChange(newValue + 1)"
          color="grey lighten-2">
          $plus
        </v-icon>
      </template>
    </v-slider>
  </v-form>
</template>

<script lang="ts">
import { Component, Prop, Watch, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { InputValidationRules } from 'vuetify'
import { VForm } from '@/types/vuetify'

@Component({})
export default class InputSlider extends Mixins(UtilsMixin) {
  @Prop({ type: Number, required: true })
  public value!: number

  @Prop({ required: false })
  public rules!: InputValidationRules

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

  @Prop({ type: String, required: false })
  public valueSuffix!: string;

  @Watch('value')
  onValueChange (val: number) {
    this.newValue = val
  }

  newValue = 0

  get form (): VForm {
    return this.$refs.form as VForm
  }

  get valid () {
    return this.form.validate()
  }

  mounted () {
    this.newValue = this.value
  }

  updateValue (e: number) {
    this.newValue = e
  }

  clickChange (val: number) {
    this.newValue = val
    this.$nextTick(() => {
      if (this.valid) {
        this.$emit('input', val)
      } else {
        this.newValue = this.value
      }
    })
  }

  emitChange (val: number) {
    if (this.valid) {
      this.$emit('input', val)
    } else {
      this.newValue = this.value
    }
  }
}
</script>

<style lang="scss">
</style>
