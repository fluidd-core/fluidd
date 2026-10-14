<template>
  <button
    type="button"
    role="switch"
    class="toggle"
    :class="{ 'toggle--on': value }"
    :aria-checked="value ? 'true' : 'false'"
    :aria-label="label"
    :disabled="disabled"
    @click="$emit('input', !value)"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/** On or off. */
@Component({})
export default class ToggleSwitch extends Vue {
  @Prop({ type: Boolean, default: false })
  readonly value!: boolean

  @Prop({ type: String, default: '' })
  readonly label!: string

  @Prop({ type: Boolean })
  readonly disabled?: boolean
}
</script>

<style lang="scss" scoped>
  .toggle {
    position: relative;
    flex: none;
    width: 44px;
    height: 26px;
    border-radius: 13px;
    background: var(--m3d-switch-off, var(--m3d-border-strong));
    transition: background-color var(--m3d-duration-fast) var(--m3d-ease);

    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgb(0 0 0 / 30%);
      transition: left var(--m3d-duration-fast) var(--m3d-ease);
    }

    &:disabled {
      opacity: 0.45;
      cursor: default;
    }
  }

  .toggle--on {
    background: var(--m3d-accent);

    &::after {
      left: 20px;
    }
  }
</style>
