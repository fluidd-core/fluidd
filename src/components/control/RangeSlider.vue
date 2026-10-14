<template>
  <input
    type="range"
    class="range"
    :min="min"
    :max="max"
    :step="step"
    :value="current"
    :disabled="disabled"
    :aria-label="label"
    :style="{ '--fill': `${fill}%` }"
    @input="onInput"
    @change="onChange"
  >
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

/** A slider that sends its value once, when let go. */
@Component({})
export default class RangeSlider extends Vue {
  @Prop({ type: Number, default: 0 })
  readonly value!: number

  @Prop({ type: Number, default: 0 })
  readonly min!: number

  @Prop({ type: Number, default: 100 })
  readonly max!: number

  @Prop({ type: Number, default: 1 })
  readonly step!: number

  @Prop({ type: String, default: '' })
  readonly label!: string

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  /** Where the thumb is while it is dragged; the value again once the printer answers. */
  dragged: number | null = null

  get current (): number {
    return this.dragged ?? (Number.isFinite(this.value) ? this.value : this.min)
  }

  @Watch('value')
  onValue () {
    this.dragged = null
  }

  onInput (event: Event) {
    this.dragged = Number((event.target as HTMLInputElement).value)
  }

  onChange (event: Event) {
    this.$emit('change', Number((event.target as HTMLInputElement).value))
  }

  get fill (): number {
    return this.max > this.min ? (this.current - this.min) / (this.max - this.min) * 100 : 0
  }
}
</script>

<style lang="scss" scoped>
  // The input is the track, filled up to the value; the thumb sits on it.
  .range {
    width: 100%;
    height: 4px;
    margin: 12px 0;
    border-radius: 2px;
    background: linear-gradient(to right, var(--m3d-accent) var(--fill), var(--m3d-border-strong) var(--fill));
    cursor: pointer;
    appearance: none;

    &:disabled {
      opacity: 0.45;
      cursor: default;
    }

    &::-webkit-slider-thumb {
      width: 20px;
      height: 20px;
      border: 0;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 4px rgb(0 0 0 / 50%);
      appearance: none;
    }

    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border: 0;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 4px rgb(0 0 0 / 50%);
    }

    &:focus-visible {
      outline: none;

      &::-webkit-slider-thumb {
        box-shadow: 0 0 0 4px var(--m3d-accent-soft), 0 1px 4px rgb(0 0 0 / 50%);
      }
    }
  }
</style>
