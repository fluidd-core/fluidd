<template>
  <app-dialog
    v-model="open"
    :title="dialog.title"
    max-width="450"
    :no-actions="dialog.footerButtons.length === 0"
  >
    <v-card-text>
      <v-row
        v-for="(item, index) in dialog.items"
        :key="`item-${index}`"
      >
        <v-col v-if="item.type === 'text'">
          {{ item.text }}
        </v-col>
        <v-col v-else-if="item.type === 'button'">
          <v-btn
            :color="item.color"
            block
            @click="handleClick(item)"
          >
            {{ item.text }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <template #actions>
      <v-spacer />

      <app-btn
        v-for="(button, index) in dialog.footerButtons"
        :key="`button-${index}`"
        :color="button.color ?? 'primary'"
        type="button"
        @click="handleClick(button)"
      >
        {{ button.text }}
      </app-btn>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { PromptDialog, PromptDialogButton } from '@/store/console/types'

@Component({})
export default class ActionCommandPromptDialog extends Mixins(StateMixin) {
  get dialog (): PromptDialog {
    return this.$store.state.console.promptDialog
  }

  get open (): boolean {
    return this.dialog.open
  }

  set open (value: boolean) {
    if (!value) {
      this.sendGcode('RESPOND TYPE=command MSG="action:prompt_end"')
    }
  }

  handleClick (button: PromptDialogButton) {
    this.sendGcode(button.command || button.text)
  }
}
</script>
