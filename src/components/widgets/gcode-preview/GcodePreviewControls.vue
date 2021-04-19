<template>
  <div>
    <gcode-preview-control-checkbox name="followProgress" label="Follow progress" v-if="showFollowProgress"/>
    <gcode-preview-control-checkbox name="showNextLayer" label="Show next layer"/>
    <gcode-preview-control-checkbox name="showPreviousLayer" label="Show previous layer"/>
    <gcode-preview-control-checkbox name="showMoves" label="Show moves"/>
    <gcode-preview-control-checkbox name="showExtrusions" label="Show extrusions"/>
    <gcode-preview-control-checkbox name="showRetractions" label="Show retractions"/>

    <app-btn v-if="showReset" @click="resetFile"
             color="secondary" text block>
      {{ $t('app.general.btn.reset_file') }}
    </app-btn>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import GcodePreviewControlCheckbox from '@/components/widgets/gcode-preview/GcodePreviewControlCheckbox.vue'

@Component({
  components: { GcodePreviewControlCheckbox }
})
export default class GcodePreviewControls extends Mixins(StateMixin) {
  get showFollowProgress () {
    const printerState = this.$store.getters['printer/getPrinterState']

    if (!['printing', 'paused'].includes(printerState)) {
      return false
    }

    const printerFile = this.$store.state.printer.printer.print_stats.filename
    const gcodePreviewFile = this.$store.getters['gcodePreview/getFile'].filename

    return gcodePreviewFile === printerFile
  }

  get showReset () {
    return this.$store.getters['gcodePreview/getMoves'].length > 0
  }

  resetFile () {
    this.$store.dispatch('gcodePreview/reset')
  }
}
</script>
