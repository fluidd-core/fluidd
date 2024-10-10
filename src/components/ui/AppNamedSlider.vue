<template>
  <v-form
    ref="form"
    :class="{'full-width-slider': fullWidth}"
    @submit.prevent
  >
    <v-row no-gutters>
      <!-- Label -->
      <v-col
        cols="12"
        sm="5"
        align-self="center"
        class="text-body-1 py-0"
        :class="{ 'text--disabled': disabled }"
        v-html="label"
      />

      <!-- Current value -->
      <v-col class="py-0">
        <v-text-field
          v-model="currentValue"
          :prefix="prefix"
          :suffix="suffix"
          :rules="textRules"
          :disabled="disabled || loading || internalLocked"
          :step="step"
          class="v-input--text-right"
          type="number"
          dense
          single-line
          outlined
          hide-details
          @focus="handleFocus"
          @blur="handleBlur"
          @keyup.enter.exact="handleSubmit(+currentValue)"
        >
          <template #prepend>
            <v-btn
              v-if="locked && isMobileViewport"
              icon
              small
              :disabled="disabled"
              style="margin-top: -4px;"
              @click="internalLocked = !internalLocked"
            >
              <v-icon
                v-if="internalLocked"
                small
              >
                $pencil
              </v-icon>
              <v-icon
                v-else
                small
              >
                $lockReset
              </v-icon>
            </v-btn>

            <app-btn
              v-if="resetValue !== undefined"
              :disabled="disabled || loading"
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

    <v-slider
      v-model="sliderValue"
      :min="min"
      :max="internalMax"
      :step="step"
      :disabled="disabled || loading || internalLocked || overridden"
      dense
      hide-details
      @start="handleStart"
      @end="handleEnd"
      @change="handleChange"
    />
  </v-form>
</template>

<script lang="ts">
import { Component, Prop, Watch, Ref, VModel, Mixins } from 'vue-property-decorator'
import type { InputValidationRules } from 'vuetify'
import type { VForm } from '@/types'
import BrowserMixin from '@/mixins/browser'

@Component({
  inheritAttrs: false
})
export default class AppNamedSlider extends Mixins(BrowserMixin) {
  @VModel({ type: Number, required: true })
    inputValue!: number

  @Prop({ type: Number })
  readonly resetValue?: number

  @Prop({ type: String, required: true })
  readonly label!: string

  @Prop({ type: Array<InputValidationRules> })
  readonly rules?: InputValidationRules[]

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: Boolean })
  readonly locked?: boolean

  @Prop({ type: Boolean })
  readonly loading?: boolean

  @Prop({ type: Number, default: 0 })
  readonly min!: number

  @Prop({ type: Number, default: 100 })
  readonly max!: number

  @Prop({ type: Boolean })
  readonly overridable?: boolean

  @Prop({ type: Number, default: 1 })
  readonly step!: number

  @Prop({ type: String })
  readonly prefix?: string

  @Prop({ type: String })
  readonly suffix?: string

  @Prop({ type: Boolean })
  readonly fullWidth?: boolean

  @Ref('form')
  readonly form!: VForm

  @Watch('value')
  onValue (value: number) {
    if (!this.hasFocus) {
      this.currentValue = value.toString()
    }
  }

  @Watch('currentValue')
  onCurrentValue (value: string) {
    const valueAsNumber = +value

    if (!isNaN(valueAsNumber)) {
      this.checkOverride(valueAsNumber)
      this.sliderValue = valueAsNumber
    }
  }

  @Watch('sliderValue')
  onSliderValue (value: number) {
    if (!this.hasFocus) {
      this.currentValue = value.toString()
    }
    this.$emit('input', value)
  }

  @Watch('locked')
  onLocked (value: boolean) {
    this.internalLocked = value
  }

  @Watch('max')
  onMax () {
    this.checkOverride(this.sliderValue)
  }

  currentValue = ''
  sliderValue = 0
  internalLocked? = false
  internalMax = 0
  overridden = false
  hasFocus = false

  get textRules () {
    // Apply a min and max rule as per the slider.
    const rules = [
      ...this.rules || [],
      this.$rules.numberValid,
      this.$rules.numberGreaterThanOrEqual(this.min)
    ]
    if (!this.overridable) {
      rules.push(
        this.$rules.numberLessThanOrEqual(this.max)
      )
    }
    return rules
  }

  checkOverride (value: number) {
    if (value > this.max && this.overridable) {
      // This is overridable, and the user wants to increase
      // past the given max. So, disable the slider - and let it be.
      this.overridden = true
      this.internalMax = value
    } else {
      // This is not overridable, or the user has reverted back to a value
      // within the given max. So, re-enable the slider - and let it be.
      this.overridden = false
      this.internalMax = this.max
    }
  }

  submitValue (value: number) {
    if (this.form.validate()) {
      this.currentValue = value.toString()

      this.internalLocked = this.locked

      this.$emit('submit', value)
    }
  }

  handleReset () {
    if (this.resetValue !== undefined) {
      this.$emit('change', this.resetValue)

      this.submitValue(this.resetValue)
    }
  }

  handleFocus (event: FocusEvent) {
    this.hasFocus = true

    if (event.target instanceof HTMLInputElement) {
      event.target.select()
    }
  }

  handleBlur () {
    if (this.hasFocus) {
      this.$emit('change', this.currentValue)

      this.currentValue = this.inputValue.toString()

      this.hasFocus = false
    }
  }

  handleSubmit (value: number) {
    this.submitValue(value)
  }

  handleStart (value: number) {
    this.hasFocus = false
    this.$emit('start', value)
  }

  handleEnd (value: number) {
    this.$emit('end', value)
  }

  handleChange (value: number) {
    this.$emit('change', value)

    this.submitValue(value)
  }

  created () {
    this.currentValue = this.inputValue.toString()
    this.sliderValue = this.inputValue
    this.internalLocked = this.locked
    this.internalMax = this.max
  }
}
</script>

<style lang="scss" scoped>
.full-width-slider {
  width: 100%;
}
</style>
