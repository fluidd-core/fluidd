<template>
  <m3-dialog
    :value="open"
    :title="title || fallbackTitle"
    :eyebrow="eyebrow"
    :tone="danger ? 'danger' : ''"
    :max-width="width"
    :persistent="persistent"
    :close-label="cancelText"
    data-tid="confirm"
    @close="choose(false)"
  >
    <p
      class="m3-dlg__text"
      data-tid="confirm-message"
    >
      {{ message }}
    </p>

    <plate-check
      v-if="plateCheck"
      v-model="plateClear"
      data-tid="confirm-plate"
    />

    <template #actions>
      <button
        type="button"
        class="cbtn cbtn--ghost"
        data-tid="confirm-cancel"
        @click="choose(false)"
      >
        {{ cancelText }}
      </button>
      <button
        type="button"
        class="cbtn"
        :class="danger ? 'cbtn--danger' : 'cbtn--primary'"
        :disabled="plateCheck && !plateClear"
        data-tid="confirm-ok"
        @click="choose(true)"
      >
        {{ okText }}
      </button>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import M3Dialog from './M3Dialog.vue'
import PlateCheck from './PlateCheck.vue'

/** How long the dialog takes to close before its answer is given. */
export const CLOSE_MS = 220

/**
 * The question behind `$confirm` (plugins/confirm.ts): what will happen, and
 * a button that says it. ✕, Esc, Cancel and a click outside all answer no.
 * The message is text, never HTML: it often holds a file's name. With
 * `plateCheck`, the button stays off until the plate check is ticked.
 */
@Component({ components: { M3Dialog, PlateCheck } })
export default class M3Confirm extends Vue {
  @Prop({ type: String, required: true })
  readonly message!: string

  @Prop({ type: String, default: '' })
  readonly title!: string

  @Prop({ type: String, default: '' })
  readonly eyebrow!: string

  /** What the button that says yes says: what will happen ("Delete", "Restart"). */
  @Prop({ type: String, default: '' })
  readonly buttonTrueText!: string

  @Prop({ type: String, default: '' })
  readonly buttonFalseText!: string

  /** It can't be undone, or it stops the printer: the button is red. */
  @Prop({ type: Boolean })
  readonly danger!: boolean

  @Prop({ type: Boolean })
  readonly persistent!: boolean

  @Prop({ type: Number, default: 440 })
  readonly width!: number

  /** A print starts: ask the plate check (PlateCheck) first. */
  @Prop({ type: Boolean })
  readonly plateCheck!: boolean

  open = true
  plateClear = false
  answered = false

  get okText (): string {
    return this.buttonTrueText || 'Continue'
  }

  get cancelText (): string {
    return this.buttonFalseText || 'Cancel'
  }

  get fallbackTitle (): string {
    return this.okText
  }

  choose (value: boolean) {
    if (this.answered) return
    if (value && this.plateCheck && !this.plateClear) return
    this.answered = true
    this.open = false
    window.setTimeout(() => this.$emit('result', value), CLOSE_MS)
  }
}
</script>
