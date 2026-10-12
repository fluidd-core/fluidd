<template>
  <m3-dialog
    :value="open"
    :eyebrow="eyebrow"
    :title="dialog.title || 'The printer is asking'"
    max-width="460"
    content-class="printer-prompt"
    data-tid="printer-prompt"
    @close="open = false"
  >
    <template v-for="(item, index) in dialog.items">
      <p
        v-if="item.type === 'text'"
        :key="`item-${index}`"
        class="m3-dlg__text printer-prompt__text"
      >
        {{ item.text }}
      </p>
      <button
        v-else-if="item.type === 'button'"
        :key="`item-${index}`"
        type="button"
        class="cbtn cbtn--wide"
        :class="tint(item.color)"
        :data-tid="`printer-prompt-item-${index}`"
        @click="handleClick(item)"
      >
        {{ item.text }}
      </button>
    </template>

    <template
      v-if="dialog.footerButtons.length"
      #actions
    >
      <button
        v-for="(button, index) in dialog.footerButtons"
        :key="`button-${index}`"
        type="button"
        class="cbtn"
        :class="tint(button.color, true)"
        :data-tid="`printer-prompt-button-${index}`"
        @click="handleClick(button)"
      >
        {{ button.text }}
      </button>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { PromptDialog, PromptDialogButton } from '@/store/console/types'
import { printerNameParts } from '@/util/printer-name'
import M3Dialog from '@/components/ui/M3Dialog.vue'

/**
 * A question the printer asks (Klipper's action:prompt, which the M1's
 * macros use: loading filament, a fan error, the plate taken off mid-print),
 * in the redesign's dialog. Its words are the macro's own. ✕, Esc and a
 * click outside end the prompt, as Klipper's prompt_end does.
 */
@Component({ components: { M3Dialog } })
export default class ActionCommandPromptDialog extends Mixins(StateMixin) {
  get dialog (): PromptDialog {
    return this.$store.state.console.promptDialog as PromptDialog
  }

  get open (): boolean {
    return this.dialog.open
  }

  set open (value: boolean) {
    if (!value) {
      this.sendGcode('RESPOND TYPE=command MSG="action:prompt_end"')
    }
  }

  get eyebrow (): string {
    const name = printerNameParts((this.$store.getters['config/getDisplayName'] as string) ?? '').name
    return name ? `From ${name}` : 'From the printer'
  }

  /** The macro's colour for a button: primary is the accent, error is red, the rest are plain. */
  tint (color: string | undefined, footer = false): string {
    switch ((color ?? (footer ? 'primary' : '')).toLowerCase()) {
      case 'primary': return 'cbtn--primary'
      case 'error': return 'cbtn--danger'
      case 'warning': return 'cbtn--warn'
      default: return ''
    }
  }

  handleClick (button: PromptDialogButton) {
    this.sendGcode(button.command || button.text)
  }
}
</script>

<style lang="scss" scoped>
  .printer-prompt__text {
    color: var(--m3d-text);
  }
</style>
