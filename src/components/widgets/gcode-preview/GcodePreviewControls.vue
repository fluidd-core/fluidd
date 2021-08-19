<template>
  <div class="px-2 mt-n2 mb-2">
    <gcode-preview-control-checkbox
      :disabled="disabled || !canFollowProgress"
      name="followProgress"
      :label="$t('app.gcode.label.follow_progress')"
    />

    <gcode-preview-control-checkbox
      :disabled="disabled"
      name="showCurrentLayer"
      :label="$t('app.gcode.label.show_current_layer')"
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
  @Prop({ type: Boolean, default: false })
  public disabled!: boolean

  get canFollowProgress () {
    const file = this.$store.getters['gcodePreview/getFile']
    const printerFile = this.$store.state.printer.printer.current_file

    return file && printerFile && (file.path + '/' + file.filename) === (printerFile.path + '/' + printerFile.filename)
    this.$store.dispatch('parts/reset')
  }
}
</script>
