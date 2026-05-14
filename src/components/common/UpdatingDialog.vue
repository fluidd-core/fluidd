<template>
  <app-dialog
    v-model="open"
    :title="updating ? $t('app.version.status.updating') : $t('app.version.status.finished')"
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
        {{ updating ? $t('app.version.status.updating') : $t('app.version.btn.finish') }}
      </app-btn>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ConsoleBrowser from '@/components/widgets/console/ConsoleBrowser.vue'
import BrowserMixin from '@/mixins/browser'
import type { UpdateResponse } from '@/store/version/types'

@Component({
  components: {
    ConsoleBrowser
  }
})
export default class UpdatingDialog extends Mixins(StateMixin, BrowserMixin) {
  @Ref('consoleBrowser')
  readonly consoleBrowserElement!: ConsoleBrowser

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
      this.$typedCommit('version/setClearUpdateResponse')
    }
  }

  get updating (): boolean {
    return this.$typedState.version.status?.busy ?? false
  }

  get responses (): UpdateResponse[] {
    return this.$typedGetters['version/getResponses']
  }
}
</script>
