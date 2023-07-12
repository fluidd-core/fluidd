<template>
  <div
    @focusin="hasFocus = true"
    @focusout="hasFocus = false"
  >
    <div
      class="v-input v-input--hide-details v-text-field v-text-field--enclosed v-text-field--outlined"
      :class="{
        'v-input--is-focused': hasFocus,
        'v-input--is-disabled': disabled,
        [$vuetify.theme.dark ? 'theme--dark': 'theme--light']: true,
      }"
    >
      <div class="v-input__control">
        <div
          ref="input-slot"
          class="v-input__slot"
          :tabindex="disabled ? undefined : 0"
        >
          <slot />
          <fieldset
            aria-hidden="true"
            :class="{
              'primary--text': hasFocus
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator'

@Component({})
export default class AppFocusableContainer extends Vue {
  @Prop({ type: Boolean, default: false })
  readonly disabled!: boolean

  @Ref('input-slot')
  readonly inputSlot!: HTMLDivElement

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
    this.inputSlot.focus()
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
