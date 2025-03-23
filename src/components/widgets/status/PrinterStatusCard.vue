<template>
  <collapsable-card
    :title="$t('app.printer.title.printer_status')"
    icon="$printer3d"
    draggable
    :collapsable="collapsable"
    layout-path="dashboard.printer-status-card"
  >
    <template #title="{inLayout}">
      <v-tabs
        v-if="!inLayout"
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
          v-if="supportsHistoryComponent && !(printerPrinting || printerPaused)"
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

    <template #collapsed-content>
      <v-progress-linear
        v-if="printerPrinting || printerPaused || filename"
        :height="6"
        :value="estimates.progress"
        color="primary"
      />
    </template>

    <v-tabs-items
      v-model="tab"
      touchless
    >
      <v-tab-item key="status">
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
import type { TimeEstimates } from '@/store/printer/types'
import getFilePaths from '@/util/get-file-paths'

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
  get supportsHistoryComponent (): boolean {
    return this.$typedGetters['server/componentSupport']('history')
  }

  get collapsable () {
    return (
      this.printerPrinting ||
      this.supportsHistoryComponent ||
      this.filename !== ''
    )
  }

  get filename (): string {
    return this.$typedState.printer.printer.print_stats?.filename ?? ''
  }

  get estimates (): TimeEstimates {
    return this.$typedGetters['printer/getTimeEstimates']
  }

  @Watch('filename')
  onPrinterPrinting (val: string) {
    this.init(val)
  }

  created () {
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
    if (this.$typedState.printer.printer.mmu?.enabled === true) {
      const { rootPath, filename: filenameOnly } = getFilePaths(filename, 'gcodes')
      const fileWithMeta = this.$typedGetters['files/getFile'](rootPath, filenameOnly)

      if (fileWithMeta != null && 'referenced_tools' in fileWithMeta) {
        const mmuPrint = (fileWithMeta.referenced_tools?.length ?? 1) > 1 || this.$typedState.printer.printer.mmu.gate !== -2

        if (mmuPrint) {
          this.$typedCommit('mmu/setDialogState', {
            show: true,
            filename
          })

          return
        }
      }
    }

    const spoolmanSupported: boolean = this.$typedGetters['spoolman/getAvailable']
    const autoSpoolSelectionDialog: boolean = this.$typedState.config.uiSettings.spoolman.autoSpoolSelectionDialog

    if (spoolmanSupported && autoSpoolSelectionDialog) {
      this.$typedCommit('spoolman/setDialogState', {
        show: true,
        filename
      })

      return
    }

    SocketActions.printerPrintStart(filename)
  }
}
</script>

<style lang="scss" scoped>
  :deep(.v-slide-group__prev),
  :deep(.v-slide-group__next) {
    display: none;
  }
</style>
