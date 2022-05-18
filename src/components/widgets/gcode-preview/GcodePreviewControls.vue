<template>
  <div>
    <gcode-preview-control-checkbox
      :disabled="disabled || !printerFileLoaded"
      name="followProgress"
      :label="$t('app.gcode.label.follow_progress')"
    />

    <gcode-preview-control-checkbox
      :disabled="disabled"
      name="showNextLayer"
      :label="$t('app.gcode.label.show_next_layer')"
    />

    <gcode-preview-control-checkbox
      :disabled="disabled"
      name="showPreviousLayer"
      :label="$t('app.gcode.label.show_previous_layer')"
    />

    <gcode-preview-control-checkbox
      :disabled="disabled"
      name="showMoves"
      :label="$t('app.gcode.label.show_moves')"
    />

    <gcode-preview-control-checkbox
      :disabled="disabled"
      name="showExtrusions"
      :label="$t('app.gcode.label.show_extrusions')"
    />

    <gcode-preview-control-checkbox
      :disabled="disabled"
      name="showRetractions"
      :label="$t('app.gcode.label.show_retractions')"
    />

    <app-btn
      :disabled="!printerFile || printerFileLoaded"
      color="primary"
      class="mt-3"
      block
      small
      @click="loadCurrent"
    >
      {{ $t('app.gcode.btn.load_current_file') }}
    </app-btn>

    <app-btn
      :disabled="noMoves"
      color="secondary"
      class="mt-3"
      block
      @click="resetFile"
    >
      {{ $t('app.general.btn.reset_file') }}
    </app-btn>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import GcodePreviewControlCheckbox from '@/components/widgets/gcode-preview/GcodePreviewControlCheckbox.vue'
import FilesMixin from '@/mixins/files'
import { AppFile } from '@/store/files/types'
import { AxiosResponse } from 'axios'

@Component({
  components: { GcodePreviewControlCheckbox }
})
export default class GcodePreviewControls extends Mixins(StateMixin, FilesMixin) {
  @Prop({ type: Boolean, default: false })
  disabled!: boolean

  get printerFile (): AppFile | undefined {
    const currentFile = this.$store.state.printer.printer.current_file

    if (currentFile.filename) {
      return currentFile
    }
  }

  get printerFileLoaded () {
    const file = this.$store.getters['gcodePreview/getFile']
    const printerFile = this.printerFile

    if (!file || !printerFile || (file.path + '/' + file.filename) !== (printerFile.path + '/' + printerFile.filename)) {
      this.$store.commit('gcodePreview/setViewerState', { followProgress: false })

      return false
    }

    return true
  }

  get noMoves () {
    return this.$store.getters['gcodePreview/getMoves'].length === 0
  }

  async loadCurrent () {
    const file = this.$store.state.printer.printer.current_file as AppFile
    this.getGcode(file)
      .then(response => response?.data)
      .then((gcode: AxiosResponse) => {
        this.$store.dispatch('gcodePreview/loadGcode', {
          file,
          gcode
        })
      })
      .catch(e => e)
      .finally(() => {
        this.$store.dispatch('files/removeFileDownload')
      })
  }

  resetFile () {
    this.$store.dispatch('gcodePreview/reset')
  }
}
</script>
