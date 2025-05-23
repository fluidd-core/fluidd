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
      <console
        :items="responses"
        :fullscreen="isMobileViewport"
        :height="250"
        readonly
      />
    </v-card-text>

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
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import Console from '@/components/widgets/console/Console.vue'
import BrowserMixin from '@/mixins/browser'
import type { UpdateResponse } from '@/store/version/types'

@Component({
  components: {
    Console
  }
})
export default class UpdatingDialog extends Mixins(StateMixin, BrowserMixin) {
  invokedDialog = false

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
