<template>
  <v-dialog
    :value="value"
    max-width="500"
    persistent
  >
    <v-card v-if="file">
      <v-card-title class="card-heading py-2 px-5">
        <v-icon left>
          $cubeScan
        </v-icon>
        <span class="focus--text">
          {{ $t('app.gcode.label.parsing_file') }}
        </span>
      </v-card-title>

      <v-card-text class="py-3 px-5">
        <div class="mb-2">
          {{ file.filename }}
        </div>
        <v-progress-linear
          :value="percent"
          color="primary"
          class="mb-2"
        />
        <table>
          <tr>
            <td class="pr-2">
              {{ $t('app.gcode.label.parsed') }}:
            </td>
            <td>
              {{ percent }}%
              ({{ $filters.getReadableFileSizeString(progress) }} /
              {{ $filters.getReadableFileSizeString(file.size) }})
            </td>
          </tr>
        </table>
      </v-card-text>

      <v-divider />

      <v-card-actions class="py-2 px-5">
        <v-spacer />
        <app-btn
          color="error"
          text
          @click="$emit('cancel'); $emit('input', false)"
        >
          {{ $t('app.general.btn.cancel') }}
        </app-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { AppFile } from '@/store/files/types'

@Component({})
export default class GcodePreviewParserProgressDialog extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: false })
  readonly value!: boolean

  @Prop({ type: Number })
  readonly progress!: number

  @Prop({ type: Object })
  readonly file!: AppFile

  get percent () {
    return Math.floor((this.progress / this.file.size) * 100)
  }
}
</script>
