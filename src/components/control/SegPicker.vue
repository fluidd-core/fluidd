<template>
  <div
    class="seg"
    :class="{ 'seg--big': big, 'seg--accent': accent, 'seg--fill': fill }"
    role="radiogroup"
    :aria-label="label"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      role="radio"
      :class="{ on: option.value === value }"
      :aria-checked="option.value === value ? 'true' : 'false'"
      :disabled="disabled || option.disabled"
      :title="option.title"
      @click="$emit('input', option.value)"
    >
      <span class="seg__label">{{ option.label }}</span>
      <span
        v-if="big && option.sub"
        class="seg__sub"
      >{{ option.sub }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

export interface SegOption {
  value: string | number;
  label: string;
  /** A second line under the label, in the big picker: "100%". */
  sub?: string;
  title?: string;
  disabled?: boolean;
}

/** A row of choices, one on: the move step, Slow/Normal/Fast, Auto/On/Off. */
@Component({})
export default class SegPicker extends Vue {
  @Prop({ type: Array, required: true })
  readonly options!: SegOption[]

  @Prop({ type: [String, Number], default: null })
  readonly value!: string | number | null

  @Prop({ type: String, default: '' })
  readonly label!: string

  @Prop({ type: Boolean })
  readonly big?: boolean

  /** The choice made is teal, as for the speed. */
  @Prop({ type: Boolean })
  readonly accent?: boolean

  /** The choices share the whole width. */
  @Prop({ type: Boolean })
  readonly fill?: boolean

  @Prop({ type: Boolean })
  readonly disabled?: boolean
}
</script>

<style lang="scss" scoped>
  .seg {
    display: inline-flex;
    flex: none;
    gap: 2px;
    padding: 3px;
    border-radius: 12px;
    background: var(--m3d-surface-2);

    button {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      height: 34px;
      padding: 0 14px;
      border-radius: 9px;
      color: var(--m3d-text-muted);
      font-size: 13px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;

      &:hover:not(:disabled) {
        color: var(--m3d-text);
      }

      &:disabled {
        opacity: 0.45;
        cursor: default;
      }
    }

    button.on {
      background: var(--m3d-fill-strong, var(--m3d-border-strong));
      color: var(--m3d-text);
    }
  }

  .seg--accent button.on {
    background: var(--m3d-accent);
    color: var(--m3d-on-accent, #00201e);
  }

  .seg--fill {
    display: flex;

    button {
      flex: 1 1 0;
    }
  }

  .seg--big button {
    height: 44px;
    line-height: 1.15;
  }

  .seg__sub {
    font-size: 11px;
    font-weight: 500;
    opacity: 0.8;
  }
</style>
