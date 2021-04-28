<template>
  <div>
    <gcode-preview-control-checkbox :disabled="disabled || !printerFileLoaded" name="followProgress"
                                    :label="$t('app.gcode.label.follow_progress')"/>
    <gcode-preview-control-checkbox :disabled="disabled" name="showNextLayer"
                                    :label="$t('app.gcode.label.show_next_layer')"/>
    <gcode-preview-control-checkbox :disabled="disabled" name="showPreviousLayer"
                                    :label="$t('app.gcode.label.show_previous_layer')"/>
    <gcode-preview-control-checkbox :disabled="disabled" name="showMoves"
                                    :label="$t('app.gcode.label.show_moves')"/>
    <gcode-preview-control-checkbox :disabled="disabled" name="showExtrusions"
                                    :label="$t('app.gcode.label.show_extrusions')"/>
    <gcode-preview-control-checkbox :disabled="disabled" name="showRetractions"
                                    :label="$t('app.gcode.label.show_retractions')"/>

    <app-btn :disabled="!printerFile || printerFileLoaded" @click="loadCurrent"
             color="primary" class="mt-3" block small>
      {{ $t('app.gcode.btn.load_current_file') }}
    </app-btn>

    <app-btn :disabled="noMoves" @click="resetFile"
             color="secondary" class="mt-3" block>
      {{ $t('app.gcode.btn.reset_file') }}
    </app-btn>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import GcodePreviewControlCheckbox from '@/components/widgets/gcode-preview/GcodePreviewControlCheckbox.vue'
import FilesMixin from '@/mixins/files'

@Component({
  components: { GcodePreviewControlCheckbox }
})
export default class GcodePreviewControls extends Mixins(StateMixin, FilesMixin) {
  @Prop({
    type: Boolean,
    default: false
  })
  disabled!: boolean

  get printerFile () {
    return this.$store.state.printer.printer.print_stats.filename
  }

  get printerFileLoaded () {
    const file = this.$store.getters['gcodePreview/getFile']

    if (!file) {
      return false
    }

    return (file.path + '/' + file.filename) === this.printerFile
  }

  get noMoves () {
    return this.$store.getters['gcodePreview/getMoves'].length === 0
  }

  async loadCurrent () {
    let [, dir, fileName] = this.printerFile.match(/(.*)(?:\/|^)(.+)/)

    dir = dir ? `gcodes/${dir}` : 'gcodes'

    // todo figure out a fallback for when file info isn't currently loaded locally
    const file = this.$store.getters['files/getFile']('gcodes', dir, fileName)

    const sizeInMB = (file?.size ?? 0) / 1024 / 1024

    if (sizeInMB >= 100) {
      const confirmed = await this.$confirm(
        // todo i18n
        `The file "${file.filename}" is ${this.$filters.getReadableFileSizeString(file.size)}, this might be resource intensive for your system. Are you sure?`,
        {
          title: this.$tc('app.general.title.gcode_preview'),
          color: 'card-heading',
          icon: '$error'
        }
      )

      if (!confirmed) {
        return
      }
    }

    const { data } = await this.getFile(fileName, dir, file?.size ?? 0)

    this.$store.dispatch('gcodePreview/loadGcode', {
      file,
      gcode: data
    })
  }

  resetFile () {
    this.$store.dispatch('gcodePreview/reset')
  }
}
</script>
