<template>
  <span
    class="acct-more"
    :class="{ 'acct-more--open': open, 'acct-more--end': end }"
    @focusout="leave"
  >
    <button
      ref="toggle"
      type="button"
      class="acct-more__toggle"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="id"
      :title="label"
      data-tid="acct-more"
      @click="toggle"
    >
      <frame-icon
        name="info"
        small
      />
      <span class="sr-only">{{ label }}</span>
    </button>
    <span
      v-if="open"
      :id="id"
      ref="body"
      class="acct-more__body"
      role="note"
      :style="shift ? { transform: `translateX(${shift}px)` } : undefined"
    ><slot /></span>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

let next = 0

/**
 * The details behind a short label, one step away: an (i) that opens a
 * small note under it. Escape, a click anywhere else, or focus moving on
 * closes it. The note slides back inside the window on a narrow screen.
 */
@Component({})
export default class AcctMore extends Vue {
  @Prop({ type: String, required: true })
  readonly label!: string

  /** Opens towards the left, for an (i) at the right edge. */
  @Prop({ type: Boolean, default: false })
  readonly end!: boolean

  open = false
  /** Pixels the note moves sideways to stay inside the window. */
  shift = 0
  readonly id = `acct-more-${++next}`

  async toggle () {
    this.open = !this.open
    this.shift = 0
    if (!this.open) return
    await this.$nextTick()
    const body = this.$refs.body as HTMLElement | undefined
    if (!body) return
    const margin = 16
    const { left, right } = body.getBoundingClientRect()
    const width = document.documentElement.clientWidth
    if (right > width - margin) this.shift = width - margin - right
    else if (left < margin) this.shift = margin - left
  }

  leave (event: FocusEvent) {
    const to = event.relatedTarget as Node | null
    if (this.open && to && !this.$el.contains(to)) this.open = false
  }

  mounted () {
    document.addEventListener('click', this.outside, true)
    document.addEventListener('keydown', this.escape)
  }

  beforeDestroy () {
    document.removeEventListener('click', this.outside, true)
    document.removeEventListener('keydown', this.escape)
  }

  outside (event: Event) {
    if (this.open && !this.$el.contains(event.target as Node)) this.open = false
  }

  escape (event: KeyboardEvent) {
    if (this.open && event.key === 'Escape') {
      this.open = false;
      (this.$refs.toggle as HTMLElement | undefined)?.focus()
    }
  }
}
</script>

<style lang="scss" scoped>
  .acct-more {
    position: relative;
    display: inline-flex;
    vertical-align: middle;
  }

  .acct-more__toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    color: var(--m3d-text-subtle);

    &:hover,
    .acct-more--open & {
      background: var(--m3d-surface-2);
      color: var(--m3d-text);
    }

    &:focus-visible {
      outline: 2px solid var(--m3d-focus-ring);
      outline-offset: 1px;
    }
  }

  .acct-more__body {
    position: absolute;
    z-index: 5;
    top: calc(100% + 6px);
    left: -8px;
    width: max-content;
    max-width: min(280px, 80vw);
    padding: 10px 12px;
    border: 1px solid var(--m3d-border);
    border-radius: 9px;
    background: var(--m3d-surface);
    box-shadow: 0 6px 24px rgb(0 0 0 / 16%);
    color: var(--m3d-text);
    font-size: 13px;
    font-weight: 400;
    line-height: 1.45;
    text-align: left;
    white-space: normal;
  }

  .acct-more--end .acct-more__body {
    right: -8px;
    left: auto;
  }
</style>
