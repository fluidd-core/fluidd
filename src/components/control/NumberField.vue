<template>
  <label
    class="numfield"
    :class="{ 'numfield--disabled': disabled, 'numfield--accent': accent }"
  >
    <input
      ref="input"
      type="text"
      inputmode="decimal"
      :value="text"
      :disabled="disabled"
      :aria-label="label"
      @focus="editing = true"
      @input="onInput"
      @keydown.enter.prevent="commit"
      @keydown.esc="cancel"
      @blur="commit"
    >
    <span
      v-if="unit"
      class="numfield__unit"
    >{{ unit }}</span>
  </label>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/**
 * An exact value, typed (Pro): it shows the live value until you type,
 * and sends only when you press Enter or leave it, and only a number in
 * range. Esc puts the live value back.
 */
@Component({})
export default class NumberField extends Vue {
  @Prop({ type: Number, default: null })
  readonly value!: number | null

  @Prop({ type: String, default: '' })
  readonly unit!: string

  @Prop({ type: String, default: '' })
  readonly label!: string

  @Prop({ type: Number, default: -Infinity })
  readonly min!: number

  @Prop({ type: Number, default: Infinity })
  readonly max!: number

  /** Digits after the point shown. */
  @Prop({ type: Number, default: 0 })
  readonly decimals!: number

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: Boolean })
  readonly accent?: boolean

  editing = false
  draft: string | null = null

  get shown (): string {
    return this.value === null || Number.isNaN(this.value) ? '' : this.value.toFixed(this.decimals)
  }

  get text (): string {
    return this.editing && this.draft !== null ? this.draft : this.shown
  }

  onInput (event: Event) {
    this.draft = (event.target as HTMLInputElement).value
  }

  commit () {
    const draft = this.draft
    this.editing = false
    this.draft = null
    if (draft === null) return
    const n = Number(draft.replace(',', '.'))
    if (draft.trim() === '' || Number.isNaN(n)) return
    const clamped = Math.min(this.max, Math.max(this.min, n))
    if (clamped !== this.value) this.$emit('change', clamped)
  }

  cancel () {
    this.draft = null
    this.editing = false;
    (this.$refs.input as HTMLInputElement).blur()
  }
}
</script>

<style lang="scss" scoped>
  .numfield {
    display: inline-flex;
    flex: none;
    align-items: baseline;
    justify-content: flex-end;
    gap: 4px;
    min-width: 92px;
    height: 32px;
    padding: 0 10px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    cursor: text;

    &:focus-within {
      box-shadow: inset 0 0 0 1.5px var(--m3d-accent);
    }

    input {
      width: 60px;
      min-width: 0;
      margin-top: 6px;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      text-align: right;
    }
  }

  .numfield--accent input {
    color: var(--m3d-accent);
  }

  .numfield--disabled {
    opacity: 0.5;
    cursor: default;
  }

  .numfield__unit {
    color: var(--m3d-text-subtle);
    font-size: 11px;
  }
</style>
