<template>
  <div
    @focusin="hasFocus = true"
    @focusout="hasFocus = false"
  >
    <v-input
      ref="input"
      class="v-text-field v-text-field--enclosed v-text-field--outlined"
      :class="{
        'v-input--is-focused': hasFocus,
      }"
      hide-details
    >
      <slot />
      <fieldset
        aria-hidden="true"
        :class="{
          'primary--text': hasFocus
        }"
      />
    </v-input>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator'
import { VInput } from '@/types'

@Component({})
export default class AppFocusableContainer extends Vue {
  @Ref('input')
  readonly input!: VInput

  hasFocus = false

  @Watch('hasFocus')
  onHasFocusChanged (value: boolean) {
    if (value) {
      this.$emit('focus')
    } else {
      this.$emit('blur')
    }
  }

  focus () {
    (this.input.$refs['input-slot'] as HTMLDivElement)?.focus()
  }
}
</script>

<style lang="scss" scoped>
  :deep(.v-input__slot) {
    padding: 0px !important;
    outline: none !important;
    cursor: default !important;

    fieldset {
      top: 0px !important;
    }
  }
</style>
