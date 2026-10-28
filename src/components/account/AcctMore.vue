<template>
  <span
    class="acct-more"
    :class="{ 'acct-more--open': open, 'acct-more--end': end }"
  >
    <button
      ref="toggle"
      type="button"
      class="acct-more__toggle"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="id"
      :title="label"
      data-tid="acct-more"
      @click="open = !open"
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
      class="acct-more__body"
      role="note"
    ><slot /></span>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

let next = 0

/**
 * The details behind a short label, one step away: an (i) that opens a
 * small note under it. Escape, or a click anywhere else, closes it.
 */
@Component({})
export default class AcctMore extends Vue {
  @Prop({ type: String, required: true })
  readonly label!: string

  /** Opens towards the left, for an (i) at the right edge. */
  @Prop({ type: Boolean, default: false })
  readonly end!: boolean

  open = false
  readonly id = `acct-more-${++next}`

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
