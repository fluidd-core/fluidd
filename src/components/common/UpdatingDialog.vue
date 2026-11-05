<template>
  <app-dialog
    v-model="open"
    :title="updating ? titleUpdating : titleFinished"
    :loading="updating"
    :close-button-disabled="updating"
    max-width="650"
    persistent
  >
    <v-card-text>
      <console-browser
        ref="consoleBrowser"
        :items="responses"
        :fullscreen="isMobileViewport"
        readonly
        @update:auto-scroll-paused="autoScrollPaused = $event"
      />
    </v-card-text>

    <template #menu>
      <app-btn
        v-if="autoScrollPaused"
        icon
        @click="consoleBrowserElement.scrollToLatest()"
      >
        <v-icon dense>
          $down
        </v-icon>
      </app-btn>
    </template>

    <template #actions>
      <v-spacer />

      <app-btn
        color="primary"
        text
        :disabled="updating"
        @click="open = false"
      >
        {{ updating ? titleUpdating : $t('app.version.btn.finish') }}
      </app-btn>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ConsoleBrowser from '@/components/widgets/console/ConsoleBrowser.vue'
import BrowserMixin from '@/mixins/browser'
import type { ConsoleLogEntry } from '@/store/console/types'

@Component({
  components: {
    ConsoleBrowser
  }
})
export default class UpdatingDialog extends Mixins(StateMixin, BrowserMixin) {
  @Ref('consoleBrowser')
  readonly consoleBrowserElement!: ConsoleBrowser

  @Prop({ type: Boolean, required: true })
  readonly updating!: boolean

  @Prop({ type: Array, required: true })
  readonly responses!: ConsoleLogEntry[]

  @Prop({ type: String, required: true })
  readonly titleUpdating!: string

  @Prop({ type: String, required: true })
  readonly titleFinished!: string

  invokedDialog = false
  autoScrollPaused = false

  get open (): boolean {
    if (this.invokedDialog || this.updating) {
      this.invokedDialog = true

      return true
    }

    return false
  }

  set open (value: boolean) {
    if (!value) {
      this.invokedDialog = false
      this.$emit('close')
    }
  }

  get endedWithNothingToShow (): boolean {
    return !this.updating && this.responses.length === 0
  }

  @Watch('endedWithNothingToShow')
  onEndedWithNothingToShow (ended: boolean) {
    if (ended) {
      this.invokedDialog = false
    }
  }
}
</script>
