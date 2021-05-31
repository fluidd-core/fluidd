<template>
  <v-form
    ref="form"
    v-model="valid"
    @submit.prevent
  >
    <v-row no-gutters>
      <!-- Label -->
      <v-col
        cols="5"
        align-self="center"
        class="dim--text text-body-1 py-0"
        v-html="label">
      </v-col>

      <!-- Current value -->
      <v-col
        class="ml-auto py-0"
      >

        <v-text-field
          :value="intendedValue"
          @change="handleChange"
          :suffix="suffix"
          :rules="textRules"
          :readonly="isLocked"
          :disabled="disabled || loading || isLocked"
          @focus="$event.target.select()"
          class="v-input--text-right"
          dense
          single-line
          outlined
          hide-details
        >
          <template v-slot:prepend>
            <v-btn
              v-if="isMobile"
              icon
              small
              :disabled="false"
              @click="lockState = !lockState"
              style="margin-top: -4px;"
            >
              <v-icon small v-if="isLocked">$pencil</v-icon>
              <v-icon small v-else>$lockReset</v-icon>
            </v-btn>

            <app-btn
              v-if="resetValue !== undefined"
              @click="handleReset"
              :disabled="disabled"
              style="margin-top: -4px;"
              color=""
              icon
              small
            >
              <v-icon small>$reset</v-icon>
            </app-btn>

          </template>
        </v-text-field>
      </v-col>
    </v-row>

    <v-slider
      v-model="intendedValue"
      :rules="rules"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled || loading || isLocked"
      @change="handleChange"
      ref="slider"
      dense
      hide-details
    >
    </v-slider>

  </v-form>
</template>

<script lang="ts">
import { Component, Prop, Watch, Mixins, Ref } from 'vue-property-decorator'
import VSlider from 'vuetify/lib/components/VSlider.vue'
import StateMixin from '@/mixins/state'
import { VForm } from '@/types/vuetify'

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

  @Prop({ type: Number, default: 1 })
  public step!: number;

  @Prop({ type: String })
  public suffix!: string;

  @Ref('slider')
  slider!: VSlider;

  @Ref('form')
  form!: VForm;

  valid = true
  lockState = false
  intendedValue: string | number = this.value

  @Watch('value')
  onValue (value: string | number) {
    this.intendedValue = +value
  }

  @Watch('intendedValue')
  async onIntendedValue (value: string | number) {
    await this.$nextTick()
    if (this.valid) this.$emit('input', +value)
  }

  get isLocked () {
    return this.lockState
  }

  set isLocked (val: boolean) {
    this.lockState = val
    this.$emit('update:locked', val)
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  get textRules () {
    // Apply a min and max rule as per the slider.
    return [
      ...this.rules,
      (v: string) => +v >= this.min || this.$t('app.general.simple_form.error.min', { min: this.min }),
      (v: string) => +v <= this.max || this.$t('app.general.simple_form.error.max', { max: this.max })
    ]
  }

  @Watch('locked')
  onLockedChange (val: boolean) {
    this.lockState = val
  }

  mounted () {
    this.lockState = this.locked
    this.intendedValue = this.value
  }

  handleChange (val: string | number) {
    val = +val
    this.$emit('input', val)
    if (this.valid && val !== this.value) {
      this.intendedValue = val
      this.$emit('change', val)
    } else {
      this.intendedValue = this.value
    }
  }

  handleReset () {
    this.$emit('input', this.resetValue)
    if (this.valid && this.value !== this.resetValue) {
      this.intendedValue = this.resetValue
      this.$emit('change', this.resetValue)
    }
  }
}
</script>
