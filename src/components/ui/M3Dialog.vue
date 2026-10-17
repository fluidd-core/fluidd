<template>
  <v-dialog
    :value="value"
    :max-width="maxWidth"
    :persistent="persistent"
    :content-class="`m3-dlg-frame ${contentClass || ''}`"
    @input="onInput"
  >
    <div
      class="m3-dlg"
      :class="tone ? `m3-dlg--${tone}` : ''"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      v-bind="$attrs"
    >
      <header class="m3-dlg__head">
        <div class="m3-dlg__titles">
          <span
            v-if="eyebrow"
            class="m3-dlg__eyebrow"
          >{{ eyebrow }}</span>
          <h2
            :id="titleId"
            ref="title"
            tabindex="-1"
            class="m3-dlg__title"
          >
            <slot name="title">
              {{ title }}
            </slot>
          </h2>
        </div>
        <button
          v-if="closable"
          type="button"
          class="m3-dlg__close"
          :aria-label="closeLabel"
          :disabled="closeDisabled"
          :data-test="closeTest"
          data-tid="m3-dlg-close"
          @click="$emit('close')"
        >
          <frame-icon name="x" />
        </button>
      </header>

      <div class="m3-dlg__body">
        <slot />
      </div>

      <footer
        v-if="$slots.actions || $scopedSlots.actions"
        class="m3-dlg__actions"
      >
        <slot name="actions" />
      </footer>
    </div>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

/** Each dialog's own id, for its title. */
let shown = 0

/**
 * The redesign's dialog: a title (with a small line above it when that
 * helps), what it's about, and its buttons, on the page's own surface. One
 * shell for every dialog Fluidd asks with ($confirm, the slicer's print
 * check, Add a printer, the printer's own prompts), so they look and behave
 * alike.
 *
 * ✕, Esc and a click outside all emit `close` (none of them, while
 * `persistent`), and the parent decides what closing means. The focus starts
 * on the title, never on a button, so a key pressed as the dialog appears
 * cannot answer it.
 */
@Component({ inheritAttrs: false })
export default class M3Dialog extends Vue {
  @Prop({ type: Boolean })
  readonly value!: boolean

  @Prop({ type: String, default: '' })
  readonly title!: string

  /** A short line above the title: what this is about. */
  @Prop({ type: String, default: '' })
  readonly eyebrow!: string

  @Prop({ type: [Number, String], default: 460 })
  readonly maxWidth!: number | string

  @Prop({ type: Boolean })
  readonly persistent!: boolean

  @Prop({ type: Boolean, default: true })
  readonly closable!: boolean

  @Prop({ type: Boolean })
  readonly closeDisabled!: boolean

  @Prop({ type: String, default: 'Close' })
  readonly closeLabel!: string

  /** A data-test for ✕, for the specs that look for it. */
  @Prop({ type: String })
  readonly closeTest?: string

  /** `danger` or `warn`: the line above the title takes the colour. */
  @Prop({ type: String, default: '' })
  readonly tone!: '' | 'danger' | 'warn'

  @Prop({ type: String })
  readonly contentClass?: string

  @Prop({ type: String })
  readonly labelId?: string

  @Prop({ type: Boolean, default: true })
  readonly focusTitle!: boolean

  uid = ++shown
  returnFocus: HTMLElement | null = null

  get titleId (): string {
    return this.labelId || `m3-dlg-title-${this.uid}`
  }

  mounted () {
    if (this.value) this.onValue(true)
  }

  @Watch('value')
  onValue (open: boolean) {
    if (open) {
      this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      if (this.focusTitle) this.$nextTick(() => this.focus())
    } else if (this.returnFocus) {
      const target = this.returnFocus
      this.returnFocus = null
      this.$nextTick(() => target.isConnected && target.focus())
    }
  }

  /**
   * The title takes the focus. Vuetify renders a dialog's content the first
   * time it opens, a moment after `value` turns on, and then focuses the
   * dialog itself unless the focus is already inside: so this tries again
   * until the title is there and has it.
   */
  focus (tries = 10) {
    const title = this.$refs.title as HTMLElement | undefined
    title?.focus()
    if (title && document.activeElement === title) return
    if (tries > 0) window.setTimeout(() => this.focus(tries - 1), 30)
  }

  /** Esc or a click outside: Vuetify closes it unless it is persistent. */
  onInput (open: boolean) {
    if (!open) this.$emit('close')
  }
}
</script>
