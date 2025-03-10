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

    <mmu-edit-ttg-map-dialog
      :show-dialog="showMmuEditTtgMapDialog"
      :file="fileForMmuDialog"
      @close="showMmuEditTtgMapDialog = false" />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { SocketActions } from '@/api/socketActions'
import StateMixin from '@/mixins/state'
import StatusControls from './StatusControls.vue'
import StatusTab from './StatusTab.vue'
import ReprintTab from './ReprintTab.vue'
import MmuEditTtgMapDialog from '@/components/widgets/mmu/MmuEditTtgMapDialog.vue'
import getFilePaths from '@/util/get-file-paths'
import type { TimeEstimates } from '@/store/printer/types'

@Component({
  components: {
    StatusControls,
    StatusTab,
    ReprintTab,
    MmuEditTtgMapDialog
  }
})
export default class PrinterStatusCard extends Mixins(StateMixin) {
  tab = 0

  // Not perfect integration but allow tool-gate mapping for MMU prints
  showMmuEditTtgMapDialog = false
  fileForMmuDialog = null

  // If the user has no history plugin, and there's no print running..
  // then hide the collapse control.
  get supportsHistoryComponent (): boolean {
    return this.$store.getters['server/componentSupport']('history')
  }

  get collapsable () {
    return (
      this.printerPrinting ||
      this.supportsHistoryComponent ||
      this.filename !== ''
    )
  }

  get filename (): string {
    return this.$store.state.printer.printer.print_stats?.filename ?? ''
  }

  get estimates (): TimeEstimates {
    return this.$store.getters['printer/getTimeEstimates']
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
    const mmuAvailable = !!this.$store.state.printer.printer.mmu && this.$store.state.printer.printer.mmu.enabled
    if (mmuAvailable) {
      const { filename: fileName, rootPath } = getFilePaths(filename, 'gcodes')
      const fileWithMeta = this.$store.getters['files/getFile'](rootPath, fileName) ?? null
      const mmuPrint = (fileWithMeta.referenced_tools?.length ?? 1) > 1 || this.$store.state.printer.printer.mmu?.gate !== -2
      if (mmuPrint) {
        this.fileForMmuDialog = fileWithMeta
        this.showMmuEditTtgMapDialog = true
        return
      }
    }

    const spoolmanSupported: boolean = this.$store.getters['spoolman/getAvailable']
    const autoSpoolSelectionDialog: boolean = this.$store.state.config.uiSettings.spoolman.autoSpoolSelectionDialog
    if (spoolmanSupported && autoSpoolSelectionDialog) {
      this.$store.commit('spoolman/setDialogState', {
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
