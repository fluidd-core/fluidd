<template>
  <v-overlay
    class="gcodeParserOverlay"
    :value="open"
    :opacity="0.85"
    absolute
  >
    <v-container>
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
            @click="$emit('cancel'); open = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </app-btn>
        </v-card-actions>
      </v-card>
    </v-container>
  </v-overlay>
</template>

<script lang="ts">
import { Component, Prop, Mixins, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { AppFile } from '@/store/files/types'

@Component({})
export default class GcodePreviewParserProgressOverlay extends Mixins(StateMixin) {
  @VModel({ type: Boolean, required: true })
    open!: boolean

  @Prop({ type: Number })
  readonly progress!: number

  @Prop({ type: Object })
  readonly file!: AppFile

  get percent () {
    return Math.floor((this.progress / this.file.size) * 100)
  }
}
</script>

<style lang="scss" scoped>
  .gcodeParserOverlay.v-overlay--active {
    border: dashed 3px #616161;
  }

  .gcodeParserOverlay :deep(.v-overlay__content) {
    width: 100%;
  }
</style>
