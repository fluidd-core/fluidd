<template>
  <collapsable-card
    :title="$t('app.printer.state.' + printerState)"
    icon="$printer3d"
    :draggable="true"
    :collapsable="collapsable"
    layout-path="dashboard.printer-status-card">
    <status-toolbar v-if="collapsable"></status-toolbar>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import StatusToolbar from './StatusToolbar.vue'

@Component({
  components: {
    StatusToolbar
  }
})
export default class PrinterStatusCard extends Mixins(StateMixin) {
  // If the user has no history plugin, and there's no print running..
  // then hide the collapse control.
  get supportsHistoryComponent () {
    return this.$store.getters['server/componentSupport']('history')
  }

  get collapsable () {
    const filename = this.$store.state.printer.printer.print_stats.filename
    return (
      this.printerPrinting ||
      this.supportsHistoryComponent ||
      filename !== ''
    )
  }
}
</script>
