<template>
  <app-dialog
    v-model="value"
    :title="$tc('app.file_system.title.upload_file', files.length)"
    max-width="500"
    persistent
    no-actions
  >
    <v-card-text>
      <template v-for="(file, i) in files">
        <v-row
          v-if="(file.percent !== 100 || !file.complete) && !file.cancelled"
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
                <td>{{ file.speed.toFixed(2) }} {{ file.unit }}/Sec</td>
              </tr>
            </table>
          </v-col>
          <v-col cols="auto">
            <app-btn
              color="error"
              icon
              text
              :disabled="file.complete || file.percent === 100 || file.cancelled"
              @click="$emit('cancel', file)"
            >
              <v-icon>$close</v-icon>
            </app-btn>
          </v-col>
        </v-row>

        <v-divider
          v-if="
            (file.percent !== 100 || !file.complete) &&
              i < files.length - 1
          "
          :key="`divider-${file.filepath}`"
        />
      </template>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { FilesUpload } from '@/store/files/types'

@Component({})
export default class FileSystemUploadDialog extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: false })
  readonly value!: boolean

  @Prop({ type: Array })
  readonly files!: FilesUpload[]
}
</script>

<style lang="scss" scoped>
  .filename {
    word-break: break-all;
  }
</style>
