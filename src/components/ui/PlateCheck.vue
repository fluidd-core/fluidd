<template>
  <div
    class="plate-check"
    :class="{ 'plate-check--done': value }"
  >
    <div class="plate-check__about">
      <span class="plate-check__icon">
        <frame-icon name="plate" />
      </span>
      <div class="plate-check__text">
        <b>{{ $t('app.plate_check.title') }}</b>
        <span>{{ $t('app.plate_check.why') }}</span>
      </div>
    </div>
    <label
      class="plate-check__tick"
      v-bind="$attrs"
    >
      <input
        type="checkbox"
        :checked="value"
        :disabled="disabled"
        @change="onChange"
      >
      <span
        class="plate-check__box"
        aria-hidden="true"
      >
        <frame-icon
          name="check"
          small
        />
      </span>
      {{ $t('app.plate_check.clear') }}
    </label>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/**
 * The plate check, before a print starts: the M1 prints upside down onto its
 * plate, so a part left there is in the nozzle's way. A tick the person
 * gives, never one given for them; whoever shows it keeps Print off until it
 * is ticked.
 */
@Component({ inheritAttrs: false })
export default class PlateCheck extends Vue {
  @Prop({ type: Boolean })
  readonly value!: boolean

  @Prop({ type: Boolean })
  readonly disabled!: boolean

  onChange (event: Event) {
    this.$emit('input', (event.target as HTMLInputElement).checked)
  }
}
</script>

<style lang="scss" scoped>
  .plate-check {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    border-radius: 16px;
    background: color-mix(in srgb, var(--m3d-warning) 10%, var(--m3d-surface-2));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--m3d-warning) 35%, transparent);
    transition: background var(--m3d-duration-base) var(--m3d-ease), box-shadow var(--m3d-duration-base) var(--m3d-ease);
  }

  .plate-check--done {
    background: var(--m3d-surface-2);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--m3d-success) 40%, transparent);
  }

  .plate-check__about {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .plate-check__icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--m3d-warning) 18%, transparent);
    color: var(--m3d-warning);

    .frame-icon {
      width: 22px;
      height: 22px;
    }
  }

  .plate-check--done .plate-check__icon {
    background: color-mix(in srgb, var(--m3d-success) 16%, transparent);
    color: var(--m3d-success);
  }

  .plate-check__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    b {
      font-size: 15px;
      font-weight: 600;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
      line-height: 1.45;
    }
  }

  .plate-check__tick {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    padding: 0 14px;
    border-radius: 12px;
    background: var(--m3d-surface);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    user-select: none;

    input {
      position: absolute;
      opacity: 0;
      width: 1px;
      height: 1px;
    }

    &:has(input:focus-visible) {
      outline: 2px solid var(--m3d-accent);
      outline-offset: 2px;
    }

    &:has(input:disabled) {
      opacity: 0.6;
      cursor: default;
    }
  }

  .plate-check__box {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 7px;
    box-shadow: inset 0 0 0 2px var(--m3d-border-strong);
    color: transparent;
    transition: background var(--m3d-duration-fast) var(--m3d-ease);
  }

  .plate-check--done .plate-check__box {
    background: var(--m3d-success);
    box-shadow: none;
    color: var(--m3d-surface);
  }
</style>
