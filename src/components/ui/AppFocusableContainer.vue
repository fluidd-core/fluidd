<template>
  <div
    @focusin="setFocus(true)"
    @focusout="setFocus(false)"
  >
    <v-input
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
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class AppFocusableContainer extends Vue {
  hasFocus = false

  setFocus (value: boolean) {
    this.hasFocus = value

    if (value) {
      this.$emit('focus')
    } else {
      this.$emit('blur')
    }
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
