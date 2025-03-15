<template>
  <v-snackbar
    :value="open"
    timeout="-1"
    multi-line
    elevation="24"
    bottom
    right
    :vertical="$vuetify.breakpoint.smAndDown"
  >
    <template v-if="currentDownload">
      <div class="mb-2">
        {{ $t('app.file_system.title.download_file') }}: {{ currentDownload.filepath }}
      </div>
      <v-progress-linear
        :value="currentDownload.percent"
        color="primary"
        class="mb-2"
      />
      <table>
        <tr>
          <td class="pr-2">
            {{ $t('app.file_system.label.downloaded') }}:
          </td>
          <td>{{ currentDownload.percent }}% ({{ $filters.getReadableFileSizeString(currentDownload.loaded) }} / {{ $filters.getReadableFileSizeString(currentDownload.size) }})</td>
        </tr>
        <tr>
          <td class="pr-2">
            {{ $t('app.file_system.label.transfer_rate') }}:
          </td>
          <td>{{ $filters.getReadableDataRateString(currentDownload.speed) }}</td>
        </tr>
      </table>
    </template>
    <template #action="{ attrs }">
      <app-btn
        v-bind="attrs"
        @click="handleCancelDownload"
      >
        {{ $t('app.general.btn.cancel') }}
      </app-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { FileDownload } from '@/store/files/types'

@Component({})
export default class FileSystemDownloadDialog extends Mixins(StateMixin) {
  get open () {
    return this.currentDownload != null
  }

  get currentDownload (): FileDownload | null {
    return this.$typedState.files.download
  }

  handleCancelDownload () {
    this.currentDownload?.abortController.abort()
  }
}
</script>
