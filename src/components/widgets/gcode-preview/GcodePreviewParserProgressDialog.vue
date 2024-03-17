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
    <template v-if="file">
      <div class="mb-2">
        {{ $t('app.gcode.label.parsing_file') }}: {{ file.filename }}
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
    </template>
    <template #action="{ attrs }">
      <app-btn
        v-bind="attrs"
        @click="$emit('cancel'); open = false"
      >
        {{ $t('app.general.btn.cancel') }}
      </app-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import { Component, Prop, Mixins, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { AppFile } from '@/store/files/types'

@Component({})
export default class GcodePreviewParserProgressDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: Number })
  readonly progress!: number

  @Prop({ type: Object })
  readonly file!: AppFile

  get percent () {
    return Math.floor((this.progress / this.file.size) * 100)
  }
}
</script>
