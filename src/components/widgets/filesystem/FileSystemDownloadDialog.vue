<template>
  <v-snackbar
    v-model="open"
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
          <td>{{ currentDownload.speed.toFixed(2) }} {{ currentDownload.unit }}/Sec</td>
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
