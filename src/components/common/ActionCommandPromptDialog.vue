<template>
  <app-dialog
    v-model="open"
    :title="dialog.title"
    max-width="450"
    :no-actions="dialog.footerButtons.length === 0"
  >
    <v-card-text>
      <v-row
        v-for="item in dialog.items"
        :key="`item::${item.id}`"
      >
        <v-col v-if="item.type === 'text'">
          {{ item.text }}
        </v-col>
        <v-col v-else-if="item.type === 'button'">
          <app-btn
            :color="item.color"
            block
            @click="handleClick(item)"
          >
            {{ item.text }}
          </app-btn>
        </v-col>
        <v-col
          v-else-if="item.type === 'button_group'"
          class="prompt-button-group"
        >
          <app-btn
            v-for="button in item.buttons"
            :key="`button::${button.id}`"
            :color="button.color"
            @click="handleClick(button)"
          >
            {{ button.text }}
          </app-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <template #actions>
      <v-spacer />

      <app-btn
        v-for="button in dialog.footerButtons"
        :key="`button::${button.id}`"
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
    return this.$typedState.console.promptDialog
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

<style lang="scss" scoped>
  .prompt-button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;

    .v-btn {
      flex: 1 1 0;
    }
  }
</style>
