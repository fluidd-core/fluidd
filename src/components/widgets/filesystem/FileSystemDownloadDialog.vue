<template>
  <v-dialog
    v-model="open"
    max-width="500"
    persistent
  >
    <v-card v-if="currentDownload">
      <v-card-title class="card-heading py-2 px-5">
        <v-icon left>
          $download
        </v-icon>
        <span class="focus--text">
          {{ $t('app.file_system.title.download_file') }}
        </span>
      </v-card-title>

      <v-card-text class="py-3 px-5">
        <div class="mb-2">
          {{ currentDownload.filepath }}
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
            <td>{{ currentDownload.speed.toFixed(2) }} {{ currentDownload.unit }}/Sec</td>
          </tr>
        </table>
      </v-card-text>

      <v-divider />

      <v-card-actions class="py-2 px-5">
        <v-spacer />
        <app-btn
          color="error"
          text
          @click="handleCancelDownload"
        >
          {{ $t('app.general.btn.cancel') }}
        </app-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { FileDownload } from '@/store/files/types'

@Component({})
export default class FileSystemDownloadDialog extends Mixins(StateMixin) {
  open = !!this.currentDownload

  @Watch('currentDownload')
  onCurrentDownloadChange (val: FileDownload | null) {
    this.open = !!val
  }

  get cancelTokenSource () {
    return this.$store.state.files.fileTransferCancelTokenSource
  }

  get currentDownload () {
    return this.$store.state.files.download
  }

  handleCancelDownload () {
    if (this.cancelTokenSource) {
      this.$store.dispatch('files/cancelFileTransferWithTokenSource', 'User cancelled.')
    }

    this.$store.dispatch('files/removeFileDownload')
  }
}
</script>
