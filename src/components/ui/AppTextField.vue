<template>
  <v-form
    ref="form"
    @submit.prevent="handleSubmit"
  >
    <v-text-field
      v-bind="$attrs"
      v-model="currentValue"
      v-on="filteredListeners"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <slot
        v-for="slot in Object.keys($slots)"
        :slot="slot"
        :name="slot"
      />
    </v-text-field>
  </v-form>
</template>

<script lang="ts">
import type { VForm } from '@/types'
import { Component, Vue, VModel, Watch, Ref } from 'vue-property-decorator'

@Component({})
export default class AppTextField extends Vue {
  @VModel()
    inputValue!: unknown

  @Ref('form')
  readonly form!: VForm

  @Watch('value')
  onValue (value: unknown) {
    if (!this.hasFocus) {
      this.currentValue = value
    }
  }

  currentValue: unknown = ''
  hasFocus = false

  get filteredListeners () {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { focus, blur, ...listeners } = this.$listeners

    return listeners
  }

  handleSubmit () {
    if (this.form.validate()) {
      this.$emit('submit', this.currentValue)
    }
  }

  handleFocus (event: FocusEvent) {
    this.hasFocus = true

    if (event.target instanceof HTMLInputElement) {
      event.target.select()

      this.$emit('focus', event)
    }
  }

  handleBlur (event: FocusEvent) {
    this.currentValue = this.inputValue

    this.hasFocus = false

    this.$emit('blur', event)
  }

  mounted () {
    this.currentValue = this.inputValue
  }
}
</script>
