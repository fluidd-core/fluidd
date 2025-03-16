<template>
  <app-dialog
    :value="open"
    :title="$tc('app.file_system.title.upload_file', uploads.length)"
    max-width="500"
    persistent
    no-actions
  >
    <v-card-text>
      <template v-for="(file, i) in uploads">
        <v-row
          :key="file.filepath"
          class="py-2"
        >
          <v-col>
            <div class="mb-2 filename">
              {{ file.filepath }}
            </div>
            <v-progress-linear
              v-if="file.percent === 100 && !file.complete"
              indeterminate
              color="primary"
              class="mb-2"
            />
            <v-progress-linear
              v-else
              :value="file.percent"
              color="primary"
              class="mb-2"
            />
            <div v-if="!file.complete && file.percent === 100">
              {{ $t('app.file_system.msg.processing') }}
            </div>
            <table v-if="file.percent > 0 && file.percent !== 100">
              <tr>
                <td class="pr-2">
                  {{ $t('app.file_system.label.uploaded') }}:
                </td>
                <td>{{ file.percent }}% ({{ $filters.getReadableFileSizeString(file.loaded) }} / {{ $filters.getReadableFileSizeString(file.size) }})</td>
              </tr>
              <tr>
                <td class="pr-2">
                  {{ $t('app.file_system.label.transfer_rate') }}:
                </td>
                <td>{{ $filters.getReadableDataRateString(file.speed) }}</td>
              </tr>
            </table>
          </v-col>
          <v-col cols="auto">
            <app-btn
              color="error"
              icon
              :disabled="file.complete || file.percent === 100 || file.cancelled"
              @click="handleCancelUpload(file)"
            >
              <v-icon>$close</v-icon>
            </app-btn>
          </v-col>
        </v-row>

        <v-divider
          v-if="i < uploads.length - 1"
          :key="`divider-${file.filepath}`"
        />
      </template>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { FileUpload } from '@/store/files/types'

@Component({})
export default class FileSystemUploadDialog extends Mixins(StateMixin) {
  get open () {
    return this.uploads.length > 0
  }

  get uploads (): FileUpload[] {
    const uploads: FileUpload[] = this.$typedState.files.uploads

    return uploads
      .filter(file => !file.cancelled && (file.percent !== 100 || !file.complete))
  }

  handleCancelUpload (file: FileUpload) {
    if (!file.complete) {
      // Hasn't started uploading...
      if (file.loaded === 0) {
        this.$typedDispatch('files/updateFileUpload', {
          uid: file.uid,
          cancelled: true
        })
      }

      // Started uploading, but not complete.
      if (file.loaded > 0 && file.loaded < file.size) {
        file.abortController.abort()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .filename {
    word-break: break-all;
  }
</style>
