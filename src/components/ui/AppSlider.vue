<template>
  <v-form ref="inputSliderForm" v-model="valid" @submit.prevent>
    <v-layout align-center justify-space-between>
      <div
        class="grey--text text--darken-1 text-body-1"
        :style="(readonly) ? 'padding: 2px 0 3px 0;' : ''"
      >
        {{ label }}
      </div>
      <div class="ml-auto d-flex align-center">
        <small
          class="grey--text mr-2"
          v-html="valueLabel"
        >
        </small>
        <span
          v-if="readonly"
          class="grey--text focus--text"
          :class="{ 'text--darken-2': disabled, 'text--lighten-1': !disabled }"
        >
          {{ newValue }}
          <small>{{valueSuffix}}</small>
        </span>
        <v-text-field
          v-if="!readonly"
          @change="handleTextChange"
          :value="newValue"
          :suffix="valueSuffix"
          :rules="rules"
          :class="classes"
          :disabled="disabled || loading"
          @focus="$event.target.select()"
          class="v-input--x-dense v-input--text-right"
          single-line
          outlined
          hide-details
        >
        </v-text-field>
      </div>
    </v-layout>
    <v-slider
      @change="handleSliderChange"
      @input="newValue = $event"
      :value="newValue"
      :rules="rules"
      :min="min"
      :max="max"
      :step="step"
      :readonly="readonly"
      :disabled="disabled || loading || readonly"
      :thumb-label="false"
      dense
      hide-details
    >
      <template v-slot:prepend>
        <v-icon
          :disabled="readonly || disabled || newValue === 0"
          @click="handleClickChange(newValue - step)"
          color="grey">
          $minus
        </v-icon>
      </template>

      <template v-slot:append>
        <v-icon
          :disabled="readonly || disabled || newValue === max"
          @click="handleClickChange(newValue + step)"
          color="grey">
          $plus
        </v-icon>
      </template>
    </v-slider>
  </v-form>
</template>

<script lang="ts">
import { Component, Prop, Watch, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { VForm } from '@/types/vuetify'

@Component({})
export default class AppSlider extends Mixins(StateMixin) {
  @Prop({ type: Number, required: true })
  public value!: number

  @Prop({ type: String })
  public valueLabel!: string

  @Prop({ type: Array, default: () => { return [] } })
  public rules!: []

  @Prop({ type: String, required: true })
  public label!: string

  @Prop({ type: String })
  public inputSm!: string

  @Prop({ type: String })
  public inputXs!: string

  @Prop({ type: String })
  public inputMd!: string

  @Prop({ type: Boolean, default: false })
  public readonly!: boolean

  @Prop({ type: Boolean, default: false })
  public disabled!: boolean

  @Prop({ type: Boolean, default: false })
  public loading!: boolean

  @Prop({ type: Number, default: 0 })
  public min!: number;

  @Prop({ type: Number, default: 100 })
  public max!: number;

  @Prop({ type: Number, default: 1 })
  public step!: number;

  @Prop({ type: String })
  public valueSuffix!: string;

  @Watch('value')
  onValueChange (val: number, oldVal: number) {
    if (val !== oldVal) this.newValue = val
  }

  // TODO: Figure out a better solution here.
  // Vuetify sets the field invalid for a split second
  // until this is updated on mount. So, until we can
  // figure out a better workaround - setting this value
  // to something we think will pass validation initially
  // for most use cases will avoid the flashing of this
  // control from invalid to valid.
  newValue = 50
  valid = true

  get form (): VForm {
    return this.$refs.inputSliderForm as VForm
  }

  get classes () {
    return {
      'v-input--width-x-small': (this.inputXs !== undefined),
      'v-input--width-small': (this.inputSm !== undefined),
      'v-input--width-medium': (this.inputMd !== undefined)
    }
  }

  mounted () {
    this.newValue = this.value
  }

  handleClickChange (val: number) {
    const num = +val
    this.newValue = num
    this.$nextTick(() => {
      this.handleSliderChange(num)
    })
  }

  handleTextChange (val: string) {
    const num = +val
    if (
      num !== this.newValue &&
      this.valid
    ) {
      this.newValue = num
      this.$emit('input', num)
    }
  }

  handleSliderChange (val: string | number) {
    const num = +val
    if (this.valid) {
      if (num !== this.value) {
        this.$emit('input', num)
      }
    } else {
      this.newValue = this.value
    }
  }
}
</script>
