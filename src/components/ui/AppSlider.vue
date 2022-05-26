<template>
  <v-form
    ref="form"
    v-model="valid"
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
        v-html="label"
      />

      <!-- Current value -->
      <v-col
        class="py-0"
      >
        <v-text-field
          v-model.number="internalValue"
          :suffix="suffix"
          :rules="textRules"
          :readonly="isLocked"
          :disabled="disabled || loading || isLocked"
          :step="step"
          class="v-input--text-right"
          type="number"
          dense
          single-line
          outlined
          hide-details
          @change="handleChange($event)"
          @focus="$event.target.select()"
        >
          <template #prepend>
            <v-btn
              v-if="isMobile"
              icon
              small
              :disabled="false"
              style="margin-top: -4px;"
              @click="lockState = !lockState"
            >
              <v-icon
                v-if="isLocked"
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

    <v-slider
      ref="slider"
      v-model="internalValue"
      :rules="rules"
      :min="min"
      :max="internalMax"
      :step="step"
      :disabled="disabled || loading || isLocked || overridden"
      dense
      hide-details
      @change="handleChange($event)"
    />
  </v-form>
</template>

<script lang="ts">
import { Component, Prop, Watch, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { VForm, VSlider } from '@/types/vuetify'

@Component({})
export default class AppSlider extends Mixins(StateMixin) {
  @Prop({ type: Number, required: true })
  public value!: number

  @Prop({ type: Number, required: false })
  public resetValue!: number;

  @Prop({ type: String, required: true })
  public label!: string

  @Prop({ type: Array, default: () => { return [] } })
  public rules!: []

  @Prop({ type: Boolean, default: false })
  public disabled!: boolean

  @Prop({ type: Boolean, default: false })
  public locked!: boolean

  @Prop({ type: Boolean, default: false })
  public loading!: boolean

  @Prop({ type: Number, default: 0 })
  public min!: number;

  @Prop({ type: Number, default: 100 })
  public max!: number;

  @Prop({ type: Boolean, default: false })
  public overridable!: boolean;

  @Prop({ type: Number, default: 1 })
  public step!: number;

  @Prop({ type: String })
  public suffix!: string;

  @Prop({ type: Boolean, default: false })
  public fullWidth!: boolean;

  @Ref('slider')
  slider!: VSlider;

  @Ref('form')
  form!: VForm;

  valid = true
  lockState = false
  overridden = false
  internalValue: number = this.value
  internalMax = this.max
  pending = false

  // If the parent updates the value.
  @Watch('value')
  onValue (value: string | number) {
    value = +value
    if (value !== this.internalValue) {
      this.internalValue = value
    }
    this.pending = false
  }

  // If one of our controls updates the value.
  @Watch('internalValue')
  onInternalValue (value: number) {
    if (this.valid) {
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

      this.$emit('input', value)
    }
  }

  get isLocked () {
    return this.lockState
  }

  set isLocked (val: boolean) {
    this.lockState = val
    this.$emit('update:locked', val)
  }

  @Watch('locked')
  onLockedChange (val: boolean) {
    this.lockState = val
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  get textRules () {
    // Apply a min and max rule as per the slider.
    const rules = [
      ...this.rules,
      (v: string | number) => !isNaN(+v) || this.$t('app.general.simple_form.error.invalid_number'),
      (v: string | number) => +v >= this.min || this.$t('app.general.simple_form.error.min', { min: this.min })
    ]
    if (!this.overridable) {
      rules.push(
        (v: string | number) => +v <= this.max || this.$t('app.general.simple_form.error.max', { max: this.max })
      )
    }
    return rules
  }

  mounted () {
    this.lockState = this.locked
  }

  handleChange (value: number) {
    if (
      value !== this.value &&
      !this.pending
    ) {
      if (this.valid) {
        this.pending = true
        this.$emit('change', value)
      } else {
        this.internalValue = this.value
      }
      this.lockState = this.locked
    }
  }

  handleReset () {
    this.internalValue = this.resetValue
    this.lockState = this.locked
    this.$emit('change', this.resetValue)
  }
}
</script>

<style lang="scss" scoped>
.full-width-slider {
  width: 100%;
}
</style>
