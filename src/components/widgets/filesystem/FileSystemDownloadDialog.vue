<template>
  <v-dialog
    :value="value"
    max-width="500"
    persistent
  >
    <v-card v-if="file">

      <v-card-title class="secondary py-2 px-5">
        <v-icon left>$download</v-icon>
        <span class="focus--text">
          {{ $t('app.file_system.title.download_file') }}
        </span>
      </v-card-title>

      <v-card-text class="py-3 px-5">
        <div class="mb-2">
          {{ file.filepath }}
        </div>
        <v-progress-linear
          :value="file.percent"
          color="primary"
          class="mb-2"
        ></v-progress-linear>
        <table>
          <tr>
            <td class="pr-2">{{ $t('app.file_system.label.downloaded') }}:</td>
            <td>{{ file.percent }}% ({{ $filters.getReadableFileSizeString(file.loaded) }} / {{ $filters.getReadableFileSizeString(file.size) }})</td>
          </tr>
          <tr>
            <td class="pr-2">{{ $t('app.file_system.label.transfer_rate') }}:</td>
            <td>{{ file.speed.toFixed(2) }} {{ file.unit }}/Sec</td>
          </tr>
        </table>
      </v-card-text>

      <v-divider />

      <v-card-actions class="py-2 px-5">
        <v-spacer></v-spacer>
        <app-btn color="error" text @click="$emit('cancel'); $emit('input', false)">{{ $t('app.general.btn.cancel') }}</app-btn>
      </v-card-actions>

    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { FileDownload } from '@/store/files/types'

@Component({})
export default class FileSystemDownloadDialog extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: false })
  value!: boolean;

  @Prop({ type: Object })
  file!: FileDownload;
}
</script>
