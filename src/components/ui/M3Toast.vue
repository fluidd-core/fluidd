<template>
  <transition name="m3-toast">
    <div
      v-if="value"
      class="m3-toast"
      :class="[`m3-toast--${tone}`, `m3-toast--${position}`]"
      :role="tone === 'error' ? 'alert' : 'status'"
      v-bind="$attrs"
    >
      <span
        v-if="icon"
        class="m3-toast__icon"
      >
        <frame-icon
          :name="icon"
          small
        />
      </span>
      <div class="m3-toast__body">
        <slot />
      </div>
      <slot name="action" />
      <button
        v-if="closable"
        type="button"
        class="m3-toast__close"
        aria-label="Close"
        data-tid="toast-close"
        @click="$emit('input', false)"
      >
        <frame-icon
          name="x"
          small
        />
      </button>
    </div>
  </transition>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

export type ToastTone = 'info' | 'success' | 'warning' | 'error'

/**
 * The redesign's toast: a short message that floats over the page, under
 * the header (or in the corner, for one that waits), with its tone, and ✕.
 * It closes itself after `timeout` ms; 0 or less keeps it until it's closed.
 * A new `stamp` while it shows starts the time again.
 */
@Component({ inheritAttrs: false })
export default class M3Toast extends Vue {
  @Prop({ type: Boolean })
  readonly value!: boolean

  @Prop({ type: String, default: 'info' })
  readonly tone!: ToastTone

  @Prop({ type: Number, default: 0 })
  readonly timeout!: number

  @Prop({ type: String, default: 'top' })
  readonly position!: 'top' | 'bottom'

  @Prop({ type: Boolean, default: true })
  readonly closable!: boolean

  /** Anything that changes when the message does. */
  @Prop({ default: null })
  readonly stamp!: unknown

  timer: number | null = null

  get icon (): string | null {
    switch (this.tone) {
      case 'success': return 'check'
      case 'warning':
      case 'error': return 'alert'
      default: return null
    }
  }

  @Watch('value', { immediate: true })
  @Watch('stamp')
  @Watch('timeout')
  restart () {
    this.stop()
    if (this.value && this.timeout > 0) {
      this.timer = window.setTimeout(() => {
        this.timer = null
        this.$emit('input', false)
      }, this.timeout)
    }
  }

  stop () {
    if (this.timer !== null) window.clearTimeout(this.timer)
    this.timer = null
  }

  beforeDestroy () {
    this.stop()
  }
}
</script>

<style lang="scss" scoped>
  .m3-toast {
    position: fixed;
    z-index: 1001;
    left: 50%;
    display: flex;
    align-items: center;
    gap: 12px;
    width: max-content;
    min-height: 52px;
    max-width: min(560px, calc(100vw - 24px));
    padding: 8px 8px 8px 16px;
    border-radius: 18px;
    background: var(--m3d-glass-thick, var(--m3d-raised));
    -webkit-backdrop-filter: var(--m3d-glass-filter, none);
    backdrop-filter: var(--m3d-glass-filter, none);
    box-shadow: var(--m3d-glass-edge, 0 0 0 1px var(--m3d-border-strong)), var(--m3d-shadow-float);
    color: var(--m3d-text);
    font-size: 14px;
    transform: translateX(-50%);
  }

  .m3-toast--top {
    top: calc(env(safe-area-inset-top, 0px) + 72px);
  }

  .m3-toast--bottom {
    bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
  }

  .m3-toast__icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin-left: -6px;
    border-radius: 50%;
  }

  .m3-toast--success .m3-toast__icon {
    background: color-mix(in srgb, var(--m3d-success) 18%, transparent);
    color: var(--m3d-success);
  }

  .m3-toast--warning .m3-toast__icon {
    background: color-mix(in srgb, var(--m3d-warning) 18%, transparent);
    color: var(--m3d-warning);
  }

  .m3-toast--error .m3-toast__icon {
    background: color-mix(in srgb, var(--m3d-danger) 16%, transparent);
    color: var(--m3d-danger);
  }

  .m3-toast__body {
    flex: 1 1 auto;
    min-width: 0;
    padding: 4px 0;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  .m3-toast__close {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: var(--m3d-text-muted);
    cursor: pointer;

    &:hover {
      background: var(--m3d-hover);
      color: var(--m3d-text);
    }
  }

  .m3-toast-enter-active,
  .m3-toast-leave-active {
    transition: opacity var(--m3d-duration-base) var(--m3d-ease), transform var(--m3d-duration-base) var(--m3d-ease);
  }

  .m3-toast-enter,
  .m3-toast-leave-to {
    opacity: 0;
  }

  .m3-toast--top.m3-toast-enter,
  .m3-toast--top.m3-toast-leave-to {
    transform: translate(-50%, -8px);
  }

  .m3-toast--bottom.m3-toast-enter,
  .m3-toast--bottom.m3-toast-leave-to {
    transform: translate(-50%, 8px);
  }
</style>
