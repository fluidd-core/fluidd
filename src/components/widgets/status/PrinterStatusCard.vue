<template>
  <collapsable-card
    :title="$t('app.printer.state.' + printerState)"
    icon="$printer3d"
    :draggable="true"
    :collapsable="collapsable"
    layout-path="dashboard.printer-status-card"
  >
    <template #title>
      <v-tabs
        v-model="tab"
        background-color="transparent"
        mobile-breakpoint="0"
        height="41"
        hide-slider
      >
        <v-tab
          key="status"
        >
          <v-icon left>
            $printer3d
          </v-icon>
          {{ $t('app.printer.state.' + printerState) || printerState }}
        </v-tab>
        <v-tab
          v-if="supportsHistoryComponent"
          key="reprint"
        >
          {{ $t('app.general.btn.reprint') }}
        </v-tab>
      </v-tabs>
    </template>

    <template #menu>
      <status-controls
        v-if="printerPrinting || printerPaused || filename"
        @print="handlePrint($event)"
      />
    </template>

    <v-tabs-items
      v-model="tab"
      style="background-color: transparent;"
      touchless
    >
      <v-tab-item
        key="status"
      >
        <status-tab />
      </v-tab-item>

      <v-tab-item
        v-if="supportsHistoryComponent"
        key="reprint"
      >
        <reprint-tab
          @print="handlePrint($event)"
        />
      </v-tab-item>
    </v-tabs-items>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { SocketActions } from '@/api/socketActions'
import StateMixin from '@/mixins/state'
import StatusControls from './StatusControls.vue'
import StatusTab from './StatusTab.vue'
import ReprintTab from './ReprintTab.vue'

@Component({
  components: {
    StatusControls,
    StatusTab,
    ReprintTab
  }
})
export default class PrinterStatusCard extends Mixins(StateMixin) {
  tab = 0

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

  get filename () {
    return this.$store.state.printer.printer.print_stats.filename
  }

  @Watch('filename')
  onPrinterPrinting (val: string) {
    this.init(val)
  }

  mounted () {
    this.init(this.filename)
  }

  init (filename: string) {
    if (filename !== '') {
      this.tab = 0
    } else {
      this.tab = 1
    }
  }

  handlePrint (filename: string) {
    SocketActions.printerPrintStart(filename)
  }
}
</script>

<style lang="scss" scoped>
  ::v-deep .v-slide-group__prev,
  ::v-deep .v-slide-group__next {
    display: none;
  }
</style>
