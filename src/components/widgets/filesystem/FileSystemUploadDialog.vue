<template>
  <v-dialog
    :value="value"
    max-width="500"
    persistent
  >
    <v-card v-if="files">
      <v-card-title class="card-heading py-2 px-5">
        <v-icon left>
          $fileUpload
        </v-icon>
        <span class="focus--text">
          {{ $tc('app.file_system.title.upload_file', files.length) }}
        </span>
      </v-card-title>

      <template
        v-for="(file, i) in files"
      >
        <v-card-text
          v-if="(file.percent !== 100 || !file.complete) && !file.cancelled"
          :key="file.filepath"
          class="py-2 px-5"
        >
          <v-row>
            <v-col>
              <div class="mb-2">
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
              <table v-if="file.percent !== 100">
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
        </v-card-text>

        <v-divider
          v-if="
            (file.percent !== 100 || !file.complete) &&
              i < files.length - 1
          "
          :key="`divider-${file.filepath}`"
        />
      </template>

      <!-- <v-divider /> -->

      <!-- <v-card-actions class="py-2 px-5">
        <v-spacer></v-spacer>
        <app-btn color="error" text @click="$emit('cancel'); $emit('input', false)">{{ $t('app.general.btn.cancel') }}</app-btn>
      </v-card-actions> -->
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { FilesUpload } from '@/store/files/types'

@Component({})
export default class FileSystemUploadDialog extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: false })
  public value!: boolean

  @Prop({ type: Array })
  public files!: FilesUpload[]
}
</script>
